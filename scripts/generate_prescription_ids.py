#!/usr/bin/env python

import uuid


def short_presc_id():
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


print(str(uuid.uuid4()).upper())
print(short_presc_id())
