from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    CLASS_TEACHER = "CLASS_TEACHER"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    STUDENT = "STUDENT"

# CRITICAL FIX: Changed from dict to list for .index() support
ROLE_HIERARCHY = [
    Role.ADMIN,
    Role.CLASS_TEACHER,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
]