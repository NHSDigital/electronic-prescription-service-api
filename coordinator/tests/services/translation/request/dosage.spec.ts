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
          durationUnit: fhir.UnitOfTime.HOUR,
          frequency: new LosslessNumber(2),
          period: new LosslessNumber(1),
          periodUnit: fhir.UnitOfTime.DAY,
          offset: new LosslessNumber(60),
          when: [
            fhir.EventTiming.BEFORE_LUNCH
          ]
        }
      }
    })
    // eslint-disable-next-line max-len
    expect(result).toEqual("Apply 100 milligram at a rate of 10 milligram per kilogram and hour over 2 hours (maximum 12 hours). twice a day 1 hour before lunch")
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
    test("doseRange is added correctly (low and high units equal)", () => {
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

    test("doseRange is added correctly (low and high units not equal)", () => {
      const result = stringifyDosage({
        doseAndRate: {
          doseRange: {
            low: {
              "value": new LosslessNumber(500),
              "unit": "milligram"
            },
            high: {
              "value": new LosslessNumber(1),
              "unit": "gram"
            }
          }
        }
      })
      expect(result).toEqual("500 milligram to 1 gram")
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
    test("rateRange is added correctly (low and high units equal)", () => {
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

    test("rateRange is added correctly (low and high units not equal)", () => {
      const result = stringifyDosage({
        doseAndRate: {
          rateRange: {
            low: {
              value: new LosslessNumber(500),
              unit: "milliliter per minute"
            },
            high: {
              value: new LosslessNumber(1),
              unit: "liter per minute"
            }
          }
        }
      })
      expect(result).toEqual("at a rate of 500 milliliter per minute to 1 liter per minute")
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

describe("frequency and period", () => {
  describe("no frequency", () => {
    test("follows general case if frequencyMax is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequencyMax: new LosslessNumber(2),
            period: new LosslessNumber(1),
            periodUnit: fhir.UnitOfTime.DAY
          }
        }
      })
      expect(result).toEqual("up to 2 times a day")
    })

    test("period is added correctly (period = 1)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            period: new LosslessNumber(1),
            periodUnit: fhir.UnitOfTime.DAY
          }
        }
      })
      expect(result).toEqual("daily")
    })

    test("results in an error if periodMax is present (period = 1)", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            period: new LosslessNumber(1),
            periodMax: new LosslessNumber(2),
            periodUnit: fhir.UnitOfTime.DAY
          }
        }
      })).toThrow(Error)
    })

    test("missing periodUnit results in an error (period = 1)", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            period: new LosslessNumber(1)
          }
        }
      })).toThrow(Error)
    })

    test("invalid periodUnit results in an error (period = 1)", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            period: new LosslessNumber(1),
            periodUnit: "ms" as fhir.UnitOfTime
          }
        }
      })).toThrow(Error)
    })

    test("results in an error (period != 1)", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            period: new LosslessNumber(2),
            periodUnit: fhir.UnitOfTime.DAY
          }
        }
      })).toThrow(Error)
    })
  })

  describe("frequency = 1", () => {
    test("follows general case if frequencyMax is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1),
            frequencyMax: new LosslessNumber(2)
          }
        }
      })
      expect(result).toEqual("1 to 2 times")
    })

    test("frequency is added correctly (period not present)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1)
          }
        }
      })
      expect(result).toEqual("once")
    })

    test("frequency and period are added correctly (period = 1, periodUnit = h)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1),
            period: new LosslessNumber(1),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("once an hour")
    })

    test("frequency and period are added correctly (period = 1, periodUnit = d)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1),
            period: new LosslessNumber(1),
            periodUnit: fhir.UnitOfTime.DAY
          }
        }
      })
      expect(result).toEqual("once a day")
    })

    test("frequency and period are added correctly if periodMax is present (period = 1)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1),
            period: new LosslessNumber(1),
            periodMax: new LosslessNumber(2),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("every 1 to 2 hours")
    })

    test("frequency and period are added correctly (period > 1)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(1),
            period: new LosslessNumber(8),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("every 8 hours")
    })
  })

  describe("frequency = 2", () => {
    test("follows general case if frequencyMax is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(2),
            frequencyMax: new LosslessNumber(3)
          }
        }
      })
      expect(result).toEqual("2 to 3 times")
    })

    test("frequency is added correctly (period not present)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(2)
          }
        }
      })
      expect(result).toEqual("twice")
    })

    test("frequency and period are added correctly (period present)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(2),
            period: new LosslessNumber(8),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("twice every 8 hours")
    })
  })

  describe("general case", () => {
    test("frequency is added correctly when frequency and frequencyMax are present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(4),
            frequencyMax: new LosslessNumber(8)
          }
        }
      })
      expect(result).toEqual("4 to 8 times")
    })

    test("frequency is added correctly when frequency is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(4)
          }
        }
      })
      expect(result).toEqual("4 times")
    })

    test("frequency is added correctly when frequencyMax is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequencyMax: new LosslessNumber(8)
          }
        }
      })
      expect(result).toEqual("up to 8 times")
    })

    test("period is added correctly when periodMax is present", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(3),
            period: new LosslessNumber(4),
            periodMax: new LosslessNumber(8),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("3 times every 4 to 8 hours")
    })

    test("period is added correctly when periodMax is not present (period = 1)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(3),
            period: new LosslessNumber(1),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("3 times an hour")
    })

    test("period is added correctly when periodMax is not present (period > 1)", () => {
      const result = stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(3),
            period: new LosslessNumber(4),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })
      expect(result).toEqual("3 times every 4 hours")
    })

    test("missing periodUnit results in an error", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(3),
            period: new LosslessNumber(2)
          }
        }
      })).toThrow(Error)
    })

    test("periodMax with no period results in an error", () => {
      expect(() => stringifyDosage({
        timing: {
          repeat: {
            frequency: new LosslessNumber(3),
            periodMax: new LosslessNumber(2),
            periodUnit: fhir.UnitOfTime.HOUR
          }
        }
      })).toThrow(Error)
    })
  })
})

describe("offset and when", () => {
  test("offset and when are added correctly (offset in minutes)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          offset: new LosslessNumber(90),
          when: [
            fhir.EventTiming.BEFORE_MEAL
          ]
        }
      }
    })
    expect(result).toEqual("90 minutes before a meal")
  })

  test("offset and when are added correctly (offset in hours)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          offset: new LosslessNumber(60),
          when: [
            fhir.EventTiming.AFTER_BREAKFAST
          ]
        }
      }
    })
    expect(result).toEqual("1 hour after breakfast")
  })

  test("offset and when are added correctly (offset in days!?)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          offset: new LosslessNumber(2880),
          when: [
            fhir.EventTiming.BEFORE_LUNCH
          ]
        }
      }
    })
    expect(result).toEqual("2 days before lunch")
  })

  test("when is added correctly (no offset)", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          when: [
            fhir.EventTiming.AFTER_SLEEP
          ]
        }
      }
    })
    expect(result).toEqual("once asleep")
  })

  test("multiple whens are added correctly", () => {
    const result = stringifyDosage({
      timing: {
        repeat: {
          when: [
            fhir.EventTiming.AT_BREAKFAST,
            fhir.EventTiming.AT_LUNCH,
            fhir.EventTiming.AT_DINNER
          ]
        }
      }
    })
    expect(result).toEqual("at breakfast, at lunch and at dinner")
  })

  test("invalid when results in an error", () => {
    expect(() => stringifyDosage({
      timing: {
        repeat: {
          offset: new LosslessNumber(60),
          when: [
            "bob" as fhir.EventTiming
          ]
        }
      }
    })).toThrow(Error)
  })

  test("missing when results in an error", () => {
    expect(() => stringifyDosage({
      timing: {
        repeat: {
          offset: new LosslessNumber(60)
        }
      }
    })).toThrow(Error)
  })
})
