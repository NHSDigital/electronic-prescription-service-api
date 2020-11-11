#!/usr/bin/env python

import os
import glob
import json
import uuid
from datetime import datetime

examples_root_dir = "../models/examples/"


def shortPrescID():
    """Create R2 (short format) Prescription ID
    Build the prescription ID and add the required checkdigit.
    Checkdigit is selected from the PRESCRIPTION_CHECKDIGIT_VALUES constant
    """
    _PRESC_CHECKDIGIT_VALUES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+'
    hexString = str(uuid.uuid1()).replace('-', '').upper()
    prescriptionID = hexString[:6] + '-Z' + hexString[6:11] + '-' + hexString[12:17]
    prscID = prescriptionID.replace('-', '')
    prscIDLength = len(prscID)
    runningTotal = 0
    for stringPosition in range(prscIDLength):
        runningTotal = runningTotal + int(prscID[stringPosition], 36) * (2 ** (prscIDLength - stringPosition))
    checkValue = (38 - runningTotal % 37) % 37
    checkValue = _PRESC_CHECKDIGIT_VALUES[checkValue]
    prescriptionID += checkValue
    return prescriptionID


def loadExamples():
    for filename in glob.iglob(examples_root_dir + '**/*.json', recursive=True):
        if "signature" in filename:
            continue
        yield filename


def updateExamples():
    authored_on = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')
    for example in loadExamples():
        if "Prepare-Request" in example:
            dir = os.path.dirname(example)
            file = os.path.basename(example)
            number = file.split('-')[0]
            print(dir)
            print(file)
            print(number)
            with open(example) as f:
                prepareJson = json.load(f)
            prepareJson["identifier"]["value"] = str(uuid.uuid4())
            for entry in prepareJson['entry']:
                resource = entry["resource"]
                if (resource["resourceType"] == "MedicationRequest"):
                    resource["groupIdentifier"]["value"] = shortPrescID()
                    resource["authoredOn"] = authored_on
            with open(example, 'w') as f:
                json.dump(prepareJson, f, indent=2)


updateExamples()
