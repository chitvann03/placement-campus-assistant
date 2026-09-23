"""
agent/agent_config.py
---------------------
Azure AI Foundry Agent Configuration & Interactive Chat Client.

Demonstrates:
- Azure AI Projects SDK integration (azure-ai-projects, azure-ai-agents)
- Authentication via AzureKeyCredential
- Tool function registration (FunctionTool)
- RAG document knowledge base connection (FileSearchTool)
- Agent creation, Thread management, and Run polling loop
- Tool call resolution & output submission
- Interactive terminal chat interface with simulated fallback mode
"""

import os
import sys
import time
import json
from typing import Dict, Any, List

# Ensure parent directory is in sys.path to import tools package
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = os.path.join(PROJECT_ROOT, ".env")
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

# Import core placement tool functions
from tools.tool_functions import (
    check_eligibility,
    get_upcoming_drives,
    interview_tips,
    check_application_status,
)

# Dispatch dictionary mapping tool name string to Python callable
TOOL_MAP = {
    "check_eligibility": check_eligibility,
    "get_upcoming_drives": get_upcoming_drives,
    "interview_tips": interview_tips,
    "check_application_status": check_application_status,
}

# Configuration settings
AZURE_PROJECT_ENDPOINT = os.getenv("AZURE_PROJECT_ENDPOINT", "https://placement-hub.services.ai.azure.com/api/project")
AZURE_API_KEY = os.getenv("AZURE_API_KEY", "")
MODEL_DEPLOYMENT = os.getenv("AZURE_MODEL_DEPLOYMENT", "gpt-5-mini")
VECTOR_STORE_ID = os.getenv("AZURE_VECTOR_STORE_ID", "")


def load_system_prompt() -> str:
    """Load system prompt from agent/system_prompt.txt."""
    prompt_file = os.path.join(CURRENT_DIR, "system_prompt.txt")
    if os.path.exists(prompt_file):
        with open(prompt_file, "r", encoding="utf-8") as f:
            return f.read()
    return "You are the Campus Placement Assistant for college students. Use tools for placement queries."


def is_valid_azure_credential() -> bool:
    """Check if authentic Azure credentials are configured in .env."""
    if not AZURE_API_KEY or "your_" in AZURE_API_KEY.lower() or AZURE_API_KEY == "":
        return False
    if not AZURE_PROJECT_ENDPOINT or "your-" in AZURE_PROJECT_ENDPOINT.lower():
        return False
    return True


def execute_tool_call(tool_name: str, arguments: Dict[str, Any]) -> str:
    """
    Execute a local Python tool function and return the JSON result string.
    
    Args:
        tool_name: Name of the function to execute
        arguments: Dictionary of keyword arguments parsed from model output
        
    Returns:
        JSON string output of the tool execution
    """
    print(f"\n⚙️  [Tool Execution] Calling '{tool_name}' with args: {arguments}")
    func = TOOL_MAP.get(tool_name)
    if not func:
        err_res = {"error": f"Tool '{tool_name}' is not recognized."}
        return json.dumps(err_res)

    try:
        result = func(**arguments)
        print(f"✅  [Tool Success] Received output for '{tool_name}'.")
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        err_res = {"error": f"Exception executing tool '{tool_name}': {str(e)}"}
        print(f"❌  [Tool Error] {err_res['error']}")
        return json.dumps(err_res)


def run_azure_agent():
    """
    Initialize and run the Azure AI Foundry Agent with tools and RAG file search.
    Requires azure-ai-projects and azure-identity packages.
    """
    try:
        from azure.ai.projects import AIProjectClient
        from azure.core.credentials import AzureKeyCredential
        from azure.ai.projects.models import (
            ToolSet,
            FunctionTool,
            FileSearchTool,
        )
    except ImportError as e:
        print(f"\n⚠️  Missing Azure SDK packages: {e}")
        print("Install required packages with: pip install -r requirements.txt")
        print("Starting interactive local simulation mode instead...\n")
        run_local_simulation()
        return

    print("=" * 65)
    print("🎓 CAMPUS PLACEMENT ASSISTANT — AZURE AI FOUNDRY AGENT")
    print("=" * 65)
    print(f"• Project Endpoint : {AZURE_PROJECT_ENDPOINT}")
    print(f"• Model Deployment : {MODEL_DEPLOYMENT}")
    print(f"• Tool Functions   : check_eligibility, get_upcoming_drives,")
    print(f"                     interview_tips, check_application_status")
    print("=" * 65)

    # 1. Initialize Azure AI Project Client
    print("\n1️⃣  Connecting to Azure AI Foundry...")
    try:
        project_client = AIProjectClient(
            endpoint=AZURE_PROJECT_ENDPOINT,
            credential=AzureKeyCredential(AZURE_API_KEY)
        )
    except Exception as ex:
        print(f"❌ Failed to initialize AIProjectClient: {ex}")
        print("Falling back to local simulation mode...\n")
        run_local_simulation()
        return

    # 2. Register Python Functions as Tools
    print("2️⃣  Registering tool functions...")
    functions = FunctionTool(
        functions=[
            check_eligibility,
            get_upcoming_drives,
            interview_tips,
            check_application_status
        ]
    )
    
    toolset = ToolSet()
    toolset.add(functions)

    # 3. Optional RAG: Attach File Search Tool if Vector Store is configured
    if VECTOR_STORE_ID:
        print(f"3️⃣  Attaching Vector Store for RAG (ID: {VECTOR_STORE_ID})...")
        file_search = FileSearchTool(vector_store_ids=[VECTOR_STORE_ID])
        toolset.add(file_search)
    else:
        print("3️⃣  No AZURE_VECTOR_STORE_ID provided; running in tool-grounded mode.")

    # 4. Create or update Agent instance
    print("4️⃣  Creating Placement Assistant Agent...")
    system_prompt = load_system_prompt()
    try:
        agent = project_client.agents.create_agent(
            model=MODEL_DEPLOYMENT,
            name="Campus-Placement-Assistant",
            instructions=system_prompt,
            toolset=toolset,
        )
        print(f"✅ Agent created successfully! (Agent ID: {agent.id})")
    except Exception as ex:
        print(f"❌ Error creating agent: {ex}")
        print("Starting local simulation mode...\n")
        run_local_simulation()
        return

    # 5. Create conversation thread
    thread = project_client.agents.create_thread()
    print(f"🧵 Conversation Thread initialized: {thread.id}")
    print("\n✨ Placement Assistant is ready! Type 'exit' or 'quit' to end.\n")

    # 6. Interactive Chat Loop
    while True:
        try:
            user_input = input("👨‍🎓 Student: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("\n👋 Good luck with your placements! See you at the T&P Cell!\n")
                break

            # Add user message to conversation thread
            project_client.agents.create_message(
                thread_id=thread.id,
                role="user",
                content=user_input
            )

            # Initiate agent run
            run = project_client.agents.create_run(
                thread_id=thread.id,
                assistant_id=agent.id
            )

            # Poll run status until completion or required action
            print("🤖 Assistant is thinking...", end="", flush=True)
            while run.status in ["queued", "in_progress", "requires_action"]:
                time.sleep(0.6)
                run = project_client.agents.get_run(thread_id=thread.id, run_id=run.id)

                if run.status == "requires_action":
                    print("\n⚡ Model requested tool execution...")
                    tool_calls = run.required_action.submit_tool_outputs.tool_calls
                    tool_outputs = []

                    for tc in tool_calls:
                        func_name = tc.function.name
                        try:
                            args = json.loads(tc.function.arguments)
                        except json.JSONDecodeError:
                            args = {}

                        output_str = execute_tool_call(func_name, args)
                        tool_outputs.append({
                            "tool_call_id": tc.id,
                            "output": output_str
                        })

                    # Submit tool outputs back to agent
                    project_client.agents.submit_tool_outputs_to_run(
                        thread_id=thread.id,
                        run_id=run.id,
                        tool_outputs=tool_outputs
                    )
                    print("🤖 Synthesizing tool outputs...", end="", flush=True)

            print()

            if run.status == "completed":
                messages = project_client.agents.list_messages(thread_id=thread.id)
                # Display the latest assistant response
                for msg in messages.data:
                    if msg.role == "assistant":
                        print(f"\n🎓 Placement Assistant:\n{msg.content[0].text.value}\n")
                        break
            else:
                print(f"\n⚠️  Run finished with status: {run.status}")
                if hasattr(run, "last_error") and run.last_error:
                    print(f"Error details: {run.last_error}")

        except KeyboardInterrupt:
            print("\nSession terminated by user.")
            break
        except Exception as e:
            print(f"\n❌ Error during conversation step: {e}\n")


def run_local_simulation():
    """
    Offline / Simulation Chat Loop.
    Executes tool functions locally so developers and evaluators can test
    capabilities without requiring live Azure credentials.
    """
    print("=" * 65)
    print("🎓 CAMPUS PLACEMENT ASSISTANT (LOCAL SIMULATION MODE)")
    print("=" * 65)
    print("💡 Note: Running without live Azure AI Foundry credentials.")
    print("All 4 tool functions are live and executing against ../data/ JSON files.")
    print("Sample queries you can try:")
    print("  1. 'Am I eligible for Google with 8.5 CGPA and CSE branch?'")
    print("  2. 'Show me upcoming placement drives for CSE'")
    print("  3. 'Give me interview tips for Amazon or Product companies'")
    print("  4. 'Check application status for student STU001'")
    print("Type 'exit' to quit.")
    print("=" * 65 + "\n")

    while True:
        try:
            query = input("👨‍🎓 Student: ").strip()
            if not query:
                continue
            if query.lower() in ["exit", "quit", "q"]:
                print("\n👋 Best wishes for your placement season!\n")
                break

            q_lower = query.lower()

            # Rule-based simulation router demonstrating tool triggers
            if "status" in q_lower or "stu" in q_lower or "application" in q_lower:
                # Extract student id if present
                import re
                match = re.search(r"\b(STU\d{3})\b", query, re.IGNORECASE)
                student_id = match.group(1).upper() if match else "STU001"
                res = check_application_status(student_id)
                print(f"\n⚙️  [Tool Execution: check_application_status('{student_id}')]")
                if res.get("found"):
                    print(f"\n🎓 Placement Assistant:")
                    print(f"Hello **{res['student_name']}** ({res['student_id']} - {res['branch']}, CGPA: {res['cgpa']})! 📋")
                    print(f"Here is your active placement status across {res['total_applications']} companies:\n")
                    for app in res["applications"]:
                        status_emoji = "🎉" if app["status"] == "Selected" else ("🗓️" if "Scheduled" in app["status"] else "⏳")
                        print(f"- **{app['company_name']}** ({app['role']})")
                        print(f"  • Status: {status_emoji} **{app['status']}**")
                        print(f"  • Applied: {app['applied_date']} | Next Step: {app['next_step']}")
                    print("\n*Data Source: Student Placement Application Portal*\n")
                else:
                    print(f"\n🎓 Placement Assistant: {res.get('message')}\n")

            elif "eligible" in q_lower or "eligibility" in q_lower or "qualify" in q_lower:
                # Simple extraction for demo simulation
                import re
                company = "Google"
                for comp in ["google", "microsoft", "amazon", "tcs", "infosys", "deloitte", "flipkart", "goldman sachs", "wipro", "accenture"]:
                    if comp in q_lower:
                        company = comp
                        break
                
                cgpa_match = re.search(r"\b(\d+\.?\d*)\s*(?:cgpa|gpa)?\b", query)
                cgpa = float(cgpa_match.group(1)) if cgpa_match else 8.0
                
                branch = "CSE"
                for br in ["cse", "it", "ece", "eee", "me", "ce"]:
                    if br in q_lower:
                        branch = br.upper()
                        break

                res = check_eligibility(company, cgpa, branch)
                print(f"\n⚙️  [Tool Execution: check_eligibility('{company}', {cgpa}, '{branch}')]")
                print(f"\n🎓 Placement Assistant:")
                if res["eligible"]:
                    details = res["company_details"]
                    print(f"🎉 **Great news! You are ELIGIBLE for {details['company_name']}!** ✅")
                    print(f"- **Minimum CGPA Cutoff**: {details['min_cgpa']}")
                    print(f"- **Allowed Branches**: {', '.join(details['allowed_branches'])}")
                    print(f"- **Package Offered**: ₹{details['package_lpa']} LPA")
                    print(f"- **Bond/Commitment**: {details.get('bond_years', 0)} years")
                    print(f"- **Requirements**: {details.get('other_requirements', 'Standard criteria')}")
                else:
                    print(f"⚠️ **Eligibility Status: Not Currently Eligible for {company.capitalize()}**")
                    print(f"- **Reason**: {res['reason']}")
                print("\n*Data Source: T&P Placement Eligibility Database*\n")

            elif "drive" in q_lower or "upcoming" in q_lower or "schedule" in q_lower or "calendar" in q_lower:
                branch = None
                for br in ["CSE", "IT", "ECE", "EEE", "ME", "CE"]:
                    if br.lower() in q_lower:
                        branch = br
                        break

                drives = get_upcoming_drives(branch=branch)
                print(f"\n⚙️  [Tool Execution: get_upcoming_drives(branch='{branch}')]")
                print(f"\n🎓 Placement Assistant:")
                print(f"Here are the upcoming campus placement drives scheduled by the T&P Cell 📅:\n")
                for d in drives[:4]:
                    print(f"### 🏢 **{d['company_name']}** — {', '.join(d['roles'])}")
                    print(f"- **Drive Date**: 🗓️ {d['date']} | **Register By**: {d['registration_deadline']}")
                    print(f"- **CTC Package**: 💰 ₹{d['package_lpa']} LPA")
                    print(f"- **Cutoff & Branches**: Min {d['eligibility_cgpa']} CGPA ({', '.join(d['branches'])})")
                    print(f"- **Venue**: 📍 {d['venue']} ({d['type']})\n")
                print("*Data Source: T&P Campus Drive Calendar 2026*\n")

            elif "tip" in q_lower or "interview" in q_lower or "prepare" in q_lower:
                target = "Google"
                for c in ["google", "microsoft", "amazon", "goldman sachs", "tcs", "infosys", "deloitte", "product", "service", "consulting"]:
                    if c in q_lower:
                        target = c
                        break

                tips = interview_tips(target)
                print(f"\n⚙️  [Tool Execution: interview_tips('{target}')]")
                print(f"\n🎓 Placement Assistant:")
                if tips.get("found"):
                    print(f"### 💡 Interview Preparation Guide for **{tips['target']}** 🚀\n")
                    for round_info in tips.get("rounds", []):
                        print(f"#### 🔹 {round_info['name']}")
                        print(f"- **Format**: {round_info['format']}")
                        print(f"- **Key Focus Topics**: {', '.join(round_info.get('common_topics', []))}")
                        print(f"- **Pro Tip**: {round_info.get('tips', ['Be prepared'])[0]}\n")
                    if tips.get("resources_links"):
                        print("#### 📚 Recommended Prep Links:")
                        for link in tips["resources_links"]:
                            print(f"- [{link['title']}]({link['url']})")
                else:
                    print(tips.get("message"))
                print("\n*Data Source: Recruiter Interview Insights Repository*\n")

            else:
                print("\n🎓 Placement Assistant:")
                print("Hello! I can help you with:")
                print("• 🎯 Checking academic eligibility for recruiters (`check_eligibility`)")
                print("• 📅 Finding upcoming drive dates and packages (`get_upcoming_drives`)")
                print("• 💡 Detailed round-by-round interview tips (`interview_tips`)")
                print("• 📊 Tracking your active job application statuses (`check_application_status`)")
                print("\nHow can I help you prepare today? 🚀\n")

        except KeyboardInterrupt:
            print("\nSession exited.")
            break


def main():
    """Main entrypoint for agent execution."""
    if is_valid_azure_credential():
        run_azure_agent()
    else:
        print("\nℹ️  Live Azure API credentials not detected in .env.")
        print("To run with live Azure AI Foundry Agent, configure AZURE_API_KEY in .env.")
        run_local_simulation()


if __name__ == "__main__":
    main()
