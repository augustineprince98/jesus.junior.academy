"""
Defines how students move between classes
at the end of an academic year.
"""

PROMOTION_FLOW = {
    "LEVEL_I": "LEVEL_II",
    "LEVEL_II": "LEVEL_III",
    "LEVEL_III": "CLASS_1",
    "CLASS_1": "CLASS_2",
    "CLASS_2": "CLASS_3",
    "CLASS_3": "CLASS_4",
    "CLASS_4": "CLASS_5",
    "CLASS_5": "CLASS_6",
    "CLASS_6": "CLASS_7",
    "CLASS_7": "CLASS_8",
    "CLASS_8": None,  # Student passes out
}
