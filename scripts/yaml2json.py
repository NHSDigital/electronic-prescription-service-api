#!/usr/bin/env python3
"""
yaml2json.py

Takes yaml file input and writes json file of the same
name in the specified directory, converting dates correctly.

Usage:
  yaml2json.py YAML_FILE OUT_DIR
"""

import json
import os
import os.path
import datetime
import yaml
from docopt import docopt


def date_converter(obj):
    """Date and datetime converter to correctly render dates in json"""
    if isinstance(obj, datetime.datetime):
        return obj.replace(tzinfo=datetime.timezone.utc).isoformat()
    if isinstance(obj, datetime.date):
        return obj.isoformat()
    return obj


def main(arguments = docopt(__doc__, version="0")):
    """Main entrypoint"""

    yaml_file_path = arguments["YAML_FILE"]
    with open(yaml_file_path, "r") as yaml_file:
        data = yaml.load(yaml_file, Loader=yaml.FullLoader)

    base_output_dir = arguments["OUT_DIR"]
    with open(
            os.path.join(base_output_dir, os.path.basename(yaml_file_path.replace(".yaml", ".json"))),
            "w"
    ) as out_file:
        out_file.write(
            json.dumps(data, default=date_converter, indent=2)
        )


if __name__ == "__main__":
    main(arguments=docopt(__doc__, version="0"))
