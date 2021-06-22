import {stringifyDosage} from "../../../../src/services/translation/request/dosage"
import {LosslessNumber} from "lossless-json"
import {fhir} from "@models"

describe("overall", () => {
  test("all fields are optional", () => {
    const result = stringifyDosage({})
    expect(result).toEqual("")
  })

  test("all fields are concatenated in the correct order", () => {
    const result = stringifyDosage({
      method: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "417924000",
          display: "Apply"
        }]
      },
      doseAndRate: {
        doseQuantity: {
          value: new LosslessNumber(100),
          unit: "milligram",
          system: "http://unitsofmeasure.org",
          code: "mg"
        },
        rateQuantity: {
          value: new LosslessNumber(10),
          unit: "milligram per kilogram and hour",
          system: "http://unitsofmeasure.org",
          code: "mg/(kg.h)"
        }
      },
      timing: {
        repeat: {
          duration: new LosslessNumber(2),
          durationMax: new LosslessNumber(12),
          durationUnit: fhir.UnitOfTime.HOUR
        }
      }
    })
    // eslint-disable-next-line max-len
    expect(result).toEqual("Apply 100 milligram at a rate of 10 milligram per kilogram and hour over 2 hours (maximum 12 hours).")
  })
})

describe("method", () => {
  test("method is added correctly", () => {
    const result = stringifyDosage({
      method: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "417924000",
          display: "Apply"
        }]
      }
    })
    expect(result).toEqual("Apply")
  })

  test("missing display results in an error", () => {
    expect(() => stringifyDosage({
      method: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "417924000"
        }]
      }
    })).toThrow(Error)
  })
})

describe("dose", () => {
  describe("doseQuantity", () => {
    test("doseQuantity is added correctly", () => {
      const result = stringifyDosage({
        doseAndRate: {
          doseQuantity: {
            "value": new LosslessNumber(10),
            "unit": "milligram"
          }
        }
      })
      expect(result).toEqual("10 milligram")
    })

    test("missing value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          doseQuantity: {
            "unit": "milligram"
          }
        }
      })).toThrow(Error)
    })

    test("missing unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          doseQuantity: {
            "value": new LosslessNumber(10)
          }
        }
      })).toThrow(Error)
    })
  })

  describe("doseRange", () => {
    test("doseRange is added correctly", () => {
      const result = stringifyDosage({
        doseAndRate: {
          doseRange: {
            low: {
              "value": new LosslessNumber(10),
              "unit": "milligram"
            },
            high: {
              "value": new LosslessNumber(20),
              "unit": "milligram"
            }
          }
        }
      })
      expect(result).toEqual("10 to 20 milligram")
    })

    test("missing low value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          doseRange: {
            low: {
              "unit": "milligram"
            },
            high: {
              "value": new LosslessNumber(20),
              "unit": "milligram"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing high value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          doseRange: {
            low: {
              "value": new LosslessNumber(10),
              "unit": "milligram"
            },
            high: {
              "unit": "milligram"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing high unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          doseRange: {
            low: {
              "value": new LosslessNumber(10),
              "unit": "milligram"
            },
            high: {
              "value": new LosslessNumber(20)
            }
          }
        }
      })).toThrow(Error)
    })
  })
})

describe("rate", () => {
  describe("rateRatio", () => {
    test("rateRatio is added correctly (denominator = 1)", () => {
      const result = stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              value: new LosslessNumber(100),
              unit: "millilitre"
            },
            denominator: {
              value: new LosslessNumber(1),
              unit: "hour"
            }
          }
        }
      })
      expect(result).toEqual("at a rate of 100 millilitre per hour")
    })

    test("rateRatio is added correctly (denominator > 1)", () => {
      const result = stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              value: new LosslessNumber(100),
              unit: "millilitre"
            },
            denominator: {
              value: new LosslessNumber(2),
              unit: "hour"
            }
          }
        }
      })
      expect(result).toEqual("at a rate of 100 millilitre every 2 hours")
    })

    test("missing numerator value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              unit: "millilitre"
            },
            denominator: {
              value: new LosslessNumber(2),
              unit: "hour"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing numerator unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              value: new LosslessNumber(100)
            },
            denominator: {
              value: new LosslessNumber(2),
              unit: "hour"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing denominator value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              value: new LosslessNumber(100),
              unit: "millilitre"
            },
            denominator: {
              unit: "hour"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing denominator unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRatio: {
            numerator: {
              value: new LosslessNumber(100),
              unit: "millilitre"
            },
            denominator: {
              value: new LosslessNumber(2)
            }
          }
        }
      })).toThrow(Error)
    })
  })

  describe("rateRange", () => {
    test("rateRange is added correctly", () => {
      const result = stringifyDosage({
        doseAndRate: {
          rateRange: {
            low: {
              value: new LosslessNumber(1),
              unit: "liter per minute"
            },
            high: {
              value: new LosslessNumber(2),
              unit: "liter per minute"
            }
          }
        }
      })
      expect(result).toEqual("at a rate of 1 to 2 liter per minute")
    })

    test("missing low value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRange: {
            low: {
              unit: "liter per minute"
            },
            high: {
              value: new LosslessNumber(2),
              unit: "liter per minute"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing high value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRange: {
            low: {
              value: new LosslessNumber(1),
              unit: "liter per minute"
            },
            high: {
              unit: "liter per minute"
            }
          }
        }
      })).toThrow(Error)
    })

    test("missing high unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateRange: {
            low: {
              value: new LosslessNumber(1),
              unit: "liter per minute"
            },
            high: {
              value: new LosslessNumber(2)
            }
          }
        }
      })).toThrow(Error)
    })
  })

  describe("rateQuantity", () => {
    test("rateQuantity is added correctly", () => {
      const result = stringifyDosage({
        doseAndRate: {
          rateQuantity: {
            value: new LosslessNumber(10),
            unit: "milligram per kilogram and hour"
          }
        }
      })
      expect(result).toEqual("at a rate of 10 milligram per kilogram and hour")
    })

    test("missing value results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateQuantity: {
            unit: "milligram per kilogram and hour"
          }
        }
      })).toThrow(Error)
    })

    test("missing unit results in an error", () => {
      expect(() => stringifyDosage({
        doseAndRate: {
          rateQuantity: {
            value: new LosslessNumber(10)
          }
        }
      })).toThrow(Error)
    })
  })
})

describe("duration", () => {
  test("duration is added correctly when durationMax is not present (duration = 1)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          duration: new LosslessNumber(1),
          durationUnit: fhir.UnitOfTime.HOUR
        }
      }
    })
    expect(result).toEqual("over 1 hour.")
  })

  test("duration is added correctly when durationMax is not present (duration > 1)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          duration: new LosslessNumber(2),
          durationUnit: fhir.UnitOfTime.HOUR
        }
      }
    })
    expect(result).toEqual("over 2 hours.")
  })

  test("duration is added correctly when durationMax is present (durationMax = 1)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          duration: new LosslessNumber(1),
          durationMax: new LosslessNumber(1),
          durationUnit: fhir.UnitOfTime.HOUR
        }
      }
    })
    expect(result).toEqual("over 1 hour (maximum 1 hour).")
  })

  test("duration is added correctly when durationMax is present (durationMax > 1)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          duration: new LosslessNumber(1),
          durationMax: new LosslessNumber(2),
          durationUnit: fhir.UnitOfTime.HOUR
        }
      }
    })
    expect(result).toEqual("over 1 hour (maximum 2 hours).")
  })

  test("missing durationUnit results in an error", () => {
    expect(() => stringifyDosage({
      timing: {
        repeat: {
          duration: new LosslessNumber(1)
        }
      }
    })).toThrow(Error)
  })
})
