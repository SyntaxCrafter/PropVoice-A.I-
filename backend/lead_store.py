lead = {
    "name": None,
    "intent": None,
    "location": None,
    "property_type": None,
    "configuration": None,
    "budget_min": None,
    "budget_max": None,
    "purpose": None,
    "timeline": None,
    "phone": None
}


def update_lead(new_data):

    for key, value in new_data.items():

        if value is not None and value != "":
            lead[key] = value

    return lead


def get_lead():

    return lead


def reset_lead():

    global lead

    lead = {
        "name": None,
        "intent": None,
        "location": None,
        "property_type": None,
        "configuration": None,
        "budget_min": None,
        "budget_max": None,
        "purpose": None,
        "timeline": None,
        "phone": None
    }

    return lead