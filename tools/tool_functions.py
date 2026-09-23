"""
tools/tool_functions.py
-----------------------
Core tool functions for the Campus Placement Assistant agent.
These functions interface with mock JSON data repositories located in ../data/
to provide deterministic, structured answers for:
1. Academic eligibility checking
2. Upcoming placement drive schedules
3. Role & company specific interview preparation tips
4. Student application status tracking
"""

import os
import json
from typing import Dict, List, Optional, Any, Union

# Define project root and data directory relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Common abbreviations mapping for robust recruiter lookup
COMPANY_ALIASES = {
    "tcs": "Tata Consultancy Services",
    "tata consultancy services": "Tata Consultancy Services",
    "tata consultancy": "Tata Consultancy Services",
    "gs": "Goldman Sachs",
    "goldman": "Goldman Sachs",
    "ms": "Microsoft",
    "msft": "Microsoft",
    "amzn": "Amazon",
    "goog": "Google",
    "infy": "Infosys",
    "cts": "Cognizant",
    "wipro": "Wipro",
    "deloitte": "Deloitte",
    "flipkart": "Flipkart",
    "accenture": "Accenture",
}

# Branch normalization mapping
BRANCH_ALIASES = {
    "computer science": "CSE",
    "computer science and engineering": "CSE",
    "computer science engineering": "CSE",
    "comps": "CSE",
    "cs": "CSE",
    "cse": "CSE",
    "information technology": "IT",
    "it": "IT",
    "electronics": "ECE",
    "electronics and communication": "ECE",
    "electronics and communication engineering": "ECE",
    "ece": "ECE",
    "electrical": "EEE",
    "electrical and electronics": "EEE",
    "electrical and electronics engineering": "EEE",
    "eee": "EEE",
    "mechanical": "ME",
    "mechanical engineering": "ME",
    "mech": "ME",
    "me": "ME",
    "civil": "CE",
    "civil engineering": "CE",
    "ce": "CE",
}


def _load_json_data(file_name: str) -> Any:
    """
    Safely load a JSON file from the data directory.
    
    Args:
        file_name: Name of the JSON file (e.g., 'eligibility_rules.json')
        
    Returns:
        Parsed JSON content (dict or list)
        
    Raises:
        FileNotFoundError: If the target file does not exist in DATA_DIR
        json.JSONDecodeError: If the file contains invalid JSON syntax
    """
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        # Fallback check relative to current working directory
        cwd_fallback = os.path.join(os.getcwd(), "data", file_name)
        if os.path.exists(cwd_fallback):
            file_path = cwd_fallback
        else:
            raise FileNotFoundError(f"Data file '{file_name}' not found at: {file_path}")
            
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_branch(branch: str) -> str:
    """Normalize input branch name to standard 3-letter acronym (e.g. CSE, IT, ECE)."""
    if not branch:
        return ""
    clean = branch.strip().lower()
    return BRANCH_ALIASES.get(clean, branch.strip().upper())


def check_eligibility(
    company: str, 
    cgpa: Union[float, int, str], 
    branch: str, 
    backlogs: Union[int, str] = 0
) -> Dict[str, Any]:
    """
    Check if a student meets academic eligibility criteria for a visiting recruiter.
    
    Loads eligibility_rules.json, performs case-insensitive and alias-aware lookup,
    evaluates CGPA cutoff, branch restrictions, and standing backlog limits.
    
    Args:
        company: Name of the target company (e.g., 'Google', 'Microsoft', 'TCS')
        cgpa: Student's current Cumulative Grade Point Average (0.0 - 10.0 scale)
        branch: Student's engineering branch (e.g., 'CSE', 'IT', 'ECE', 'ME')
        backlogs: Number of active backlogs/arrears (defaults to 0)
        
    Returns:
        dict: {
            "eligible": bool,
            "reason": str,
            "company_details": dict or None,
            "failed_criteria": list[str] (if not eligible)
        }
    """
    try:
        rules_data = _load_json_data("eligibility_rules.json")
    except Exception as e:
        return {
            "eligible": False,
            "reason": f"System error loading eligibility database: {str(e)}",
            "company_details": None
        }

    # Validate and convert numerical inputs
    try:
        student_cgpa = float(cgpa)
    except (ValueError, TypeError):
        return {
            "eligible": False,
            "reason": f"Invalid CGPA value '{cgpa}'. Must be a valid floating-point number.",
            "company_details": None
        }

    try:
        student_backlogs = int(backlogs) if backlogs is not None else 0
    except (ValueError, TypeError):
        return {
            "eligible": False,
            "reason": f"Invalid backlogs count '{backlogs}'. Must be an integer.",
            "company_details": None
        }

    if not company or not company.strip():
        return {
            "eligible": False,
            "reason": "Company name must be provided.",
            "company_details": None
        }

    company_query = company.strip().lower()
    resolved_company = COMPANY_ALIASES.get(company_query, company_query)
    
    # Locate company in rules (exact match -> alias match -> partial match)
    matched_rule = None
    for rule in rules_data:
        rule_name_lower = rule["company_name"].strip().lower()
        if rule_name_lower == company_query or rule_name_lower == resolved_company.lower():
            matched_rule = rule
            break
        if company_query in rule_name_lower or rule_name_lower in company_query:
            matched_rule = rule
            break

    if not matched_rule:
        available_companies = [r["company_name"] for r in rules_data]
        return {
            "eligible": False,
            "reason": f"Recruiter '{company}' not found in eligibility database. Available companies: {', '.join(available_companies)}.",
            "company_details": None
        }

    # Validate criteria
    norm_branch = normalize_branch(branch)
    min_cgpa = matched_rule["min_cgpa"]
    allowed_branches = [b.upper() for b in matched_rule["allowed_branches"]]
    max_backlogs = matched_rule.get("max_backlogs_allowed", 0)

    failed_criteria = []
    
    # 1. CGPA check
    if student_cgpa < min_cgpa:
        failed_criteria.append(
            f"CGPA {student_cgpa:.2f} is below the minimum cutoff of {min_cgpa:.2f}"
        )

    # 2. Branch check
    if norm_branch not in allowed_branches:
        failed_criteria.append(
            f"Branch '{norm_branch}' is not in allowed branches: {', '.join(allowed_branches)}"
        )

    # 3. Backlog check
    if student_backlogs > max_backlogs:
        failed_criteria.append(
            f"Active backlogs ({student_backlogs}) exceed the maximum permitted ({max_backlogs})"
        )

    if failed_criteria:
        reason = (
            f"Not eligible for {matched_rule['company_name']}. "
            f"Disqualification reasons: {'; '.join(failed_criteria)}."
        )
        return {
            "eligible": False,
            "reason": reason,
            "company_details": matched_rule,
            "failed_criteria": failed_criteria
        }

    # If all criteria are met
    success_reason = (
        f"Eligible for {matched_rule['company_name']}! Meets CGPA cutoff "
        f"(minimum {min_cgpa:.2f}), branch criteria ({norm_branch}), and backlog limit (allowed {max_backlogs})."
    )
    return {
        "eligible": True,
        "reason": success_reason,
        "company_details": matched_rule
    }


def get_upcoming_drives(
    branch: Optional[str] = None, 
    min_cgpa: Optional[Union[float, int, str]] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve scheduled campus placement drives, optionally filtered by branch and student's CGPA.
    
    Loads placement_drives.json and filters drives where the student meets the criteria.
    When min_cgpa is provided, returns drives where the drive's cutoff is <= student's CGPA.
    
    Args:
        branch: Optional engineering branch filter (e.g. 'CSE', 'ECE')
        min_cgpa: Optional student's CGPA to filter drives they qualify for (e.g. 7.5)
        
    Returns:
        list: Matching drive objects sorted by drive date in chronological order
    """
    try:
        drives_data = _load_json_data("placement_drives.json")
    except Exception as e:
        return [{
            "error": f"Error loading placement drives database: {str(e)}"
        }]

    parsed_cgpa = None
    if min_cgpa is not None:
        try:
            parsed_cgpa = float(min_cgpa)
        except (ValueError, TypeError):
            pass

    target_branch = normalize_branch(branch) if branch else None

    matching_drives = []
    for drive in drives_data:
        # Branch match filter
        if target_branch:
            drive_branches = [b.upper() for b in drive.get("branches", [])]
            if target_branch not in drive_branches:
                continue

        # CGPA cutoff filter (returns drives that student with parsed_cgpa qualifies for)
        if parsed_cgpa is not None:
            drive_cutoff = float(drive.get("eligibility_cgpa", 0.0))
            if parsed_cgpa < drive_cutoff:
                continue

        matching_drives.append(drive)

    # Sort drives by date ascending
    matching_drives.sort(key=lambda x: x.get("date", ""))
    return matching_drives


def interview_tips(company_or_role: str) -> Dict[str, Any]:
    """
    Search interview preparation guidelines by company name or recruiting category/type.
    
    Loads interview_tips.json, searches both specific 'companies' (e.g., 'Google', 'Microsoft')
    and broader 'company_types' (e.g., 'product', 'service', 'consulting', 'startup', 'finance').
    
    Args:
        company_or_role: Name of company ('Google', 'TCS') or category ('product', 'service', 'consulting')
        
    Returns:
        dict: Detailed interview breakdown with rounds, formats, tips, and study resources
    """
    try:
        tips_data = _load_json_data("interview_tips.json")
    except Exception as e:
        return {
            "found": False,
            "message": f"Error loading interview tips database: {str(e)}"
        }

    if not company_or_role or not company_or_role.strip():
        return {
            "found": False,
            "message": "Please provide a company name (e.g., 'Google', 'Amazon', 'TCS') or category (e.g., 'product', 'service', 'consulting')."
        }

    query = company_or_role.strip().lower()
    resolved_query = COMPANY_ALIASES.get(query, query)

    companies_dict = tips_data.get("companies", {})
    types_dict = tips_data.get("company_types", {})

    # 1. Check for specific company match (exact -> alias -> partial)
    for comp_name, comp_tips in companies_dict.items():
        comp_lower = comp_name.lower()
        if (
            comp_lower == query 
            or comp_lower == resolved_query.lower()
            or query in comp_lower 
            or comp_lower in query
        ):
            return {
                "found": True,
                "target": comp_name,
                "target_type": "company",
                "rounds": comp_tips.get("rounds", []),
                "general_tips": comp_tips.get("general_tips", []),
                "resources_links": comp_tips.get("resources_links", [])
            }

    # 2. Check for company_types match
    role_to_type_map = {
        "sde": "product",
        "software engineer": "product",
        "developer": "product",
        "analyst": "consulting",
        "consultant": "consulting",
        "qa": "service",
        "banking": "finance",
        "investment banking": "finance",
        "fintech": "finance",
    }
    
    mapped_type = role_to_type_map.get(query, query)

    for type_name, type_tips in types_dict.items():
        type_lower = type_name.lower()
        if type_lower == mapped_type or mapped_type in type_lower or type_lower in mapped_type:
            return {
                "found": True,
                "target": type_name.capitalize(),
                "target_type": "company_type",
                "rounds": type_tips.get("rounds", []),
                "general_tips": type_tips.get("general_tips", []),
                "resources_links": type_tips.get("resources_links", [])
            }

    # Not found fallback
    return {
        "found": False,
        "message": (
            f"No specific interview tips found for '{company_or_role}'. "
            f"Available specific companies: {', '.join(companies_dict.keys())}. "
            f"Available categories: {', '.join(types_dict.keys())}."
        ),
        "available_companies": list(companies_dict.keys()),
        "available_categories": list(types_dict.keys())
    }


def check_application_status(student_id: str) -> Dict[str, Any]:
    """
    Look up mock student placement applications and active hiring statuses by student ID.
    
    Loads applications_mock.json and retrieves student applications, interview rounds, and next steps.
    
    Args:
        student_id: College student identifier (e.g., 'STU001', 'STU002')
        
    Returns:
        dict: Student profile, active applications, statuses, and scheduled next steps
    """
    try:
        apps_data = _load_json_data("applications_mock.json")
    except Exception as e:
        return {
            "found": False,
            "message": f"Error loading applications database: {str(e)}"
        }

    if not student_id or not student_id.strip():
        return {
            "found": False,
            "message": "Student ID cannot be empty. Please provide an ID (e.g. STU001)."
        }

    query_id = student_id.strip().upper()

    for student in apps_data:
        if student.get("student_id", "").strip().upper() == query_id:
            return {
                "found": True,
                "student_id": student["student_id"],
                "student_name": student["student_name"],
                "branch": student["branch"],
                "cgpa": student["cgpa"],
                "total_applications": len(student.get("applications", [])),
                "applications": student.get("applications", [])
            }

    valid_ids = [s.get("student_id") for s in apps_data if "student_id" in s]
    return {
        "found": False,
        "message": f"No records found for Student ID '{student_id}'.",
        "valid_demo_ids": valid_ids
    }
