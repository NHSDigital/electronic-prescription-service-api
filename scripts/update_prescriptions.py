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


def loadPrepareExamples():
    for filename in glob.iglob(examples_root_dir + '**/*Prepare-Request*.json', recursive=True):
        yield filename


def replaceIdsAndAuthoredOn(exampleFilePath, prescription_id, short_prescription_id, authored_on):
    with open(exampleFilePath) as f:
        prepareJson = json.load(f)
    prepareJson["identifier"]["value"] = prescription_id
    for entry in prepareJson['entry']:
        resource = entry["resource"]
        if (resource["resourceType"] == "MedicationRequest"):
            resource["groupIdentifier"]["value"] = short_prescription_id
            resource["authoredOn"] = authored_on
    with open(exampleFilePath, 'w') as f:
        json.dump(prepareJson, f, indent=2)


def updateExamples():
    authored_on = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')

    for prepare in loadPrepareExamples():
        prescription_id = str(uuid.uuid4())
        short_prescription_id = shortPrescID()

        replaceIdsAndAuthoredOn(prepare, prescription_id, short_prescription_id, authored_on)

        dir = os.path.dirname(prepare)
        file = os.path.basename(prepare)
        filename_parts = file.split('-')
        number = filename_parts[0]
        status_code_and_ext = filename_parts[4] if len(filename_parts) == 5 else filename_parts[3]

        for process in glob.iglob(dir + '/' + number + '-Process-Request-*-' + status_code_and_ext):
            replaceIdsAndAuthoredOn(process, prescription_id, short_prescription_id, authored_on)


updateExamples()
