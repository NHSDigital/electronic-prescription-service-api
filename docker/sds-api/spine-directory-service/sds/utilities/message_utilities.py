import re
import uuid


def get_uuid():
    """Generate a UUID suitable for sending in messages to Spine.

    :return: A string representation of the UUID.
    """
    return str(uuid.uuid4()).upper()


def replace_uuid(message: str, new_uuid: str):
    return re.sub("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}",
                  new_uuid, message)
