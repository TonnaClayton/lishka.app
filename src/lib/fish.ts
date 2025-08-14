import { log } from "./logging";

// Data validation function to check for potentially inaccurate AI responses
export const validateFishingData = (
  data: any,
  fishName: string,
  location: string,
) => {
  const warnings = [];
  const errors = [];

  log(`🔍 Validating fishing data for ${fishName} in ${location}`);

  // Validate trolling distances
  if (data.fishingMethods) {
    data.fishingMethods.forEach((method: any, index: number) => {
      if (method.method && method.method.toLowerCase().includes("troll")) {
        const trollingDistance = method.gear?.trollingDistance;
        if (trollingDistance) {
          const numbers = trollingDistance.match(/\d+/g);
          if (numbers) {
            const distances = numbers.map(Number);
            const maxDistance = Math.max(...distances);
            const minDistance = Math.min(...distances);

            // Flag suspicious trolling distances
            if (maxDistance > 300) {
              errors.push(
                `Trolling distance too high: ${trollingDistance} (Method: ${method.method})`,
              );
            } else if (maxDistance > 200) {
              warnings.push(
                `Trolling distance seems high: ${trollingDistance} (Method: ${method.method})`,
              );
            }
          }
        }
      }

      // Validate depths
      const depth = method.gear?.depth;
      if (depth) {
        const depthNumbers = depth.match(/\d+/g);
        if (depthNumbers) {
          const maxDepth = Math.max(...depthNumbers.map(Number));
          if (maxDepth > 1000) {
            warnings.push(
              `Depth seems very deep: ${depth} (Method: ${method.method})`,
            );
          }
        }
      }

      // Validate trolling speeds
      const trollingSpeed = method.gear?.trollingSpeed;
      if (trollingSpeed) {
        const speedNumbers = trollingSpeed.match(/\d+/g);
        if (speedNumbers) {
          const maxSpeed = Math.max(...speedNumbers.map(Number));
          if (maxSpeed > 15) {
            warnings.push(
              `Trolling speed seems high: ${trollingSpeed} (Method: ${method.method})`,
            );
          }
        }
      }
    });
  }

  // Log validation results
  if (errors.length > 0) {
    console.error("❌ Data validation errors:", errors);
  }
  if (warnings.length > 0) {
    console.warn("⚠️ Data validation warnings:", warnings);
  }
  if (errors.length === 0 && warnings.length === 0) {
    log("✅ Data validation passed");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    validationTimestamp: new Date().toISOString(),
  };
};

// Validation function to detect and prevent AI hallucination
export const validateAndSanitizeRegulations = (
  regulations: any,
  location: string,
) => {
  const validatedRegulations = { ...regulations };
  const validationFlags = {
    suspiciousSourcesDetected: false,
    genericSourcesReplaced: false,
    confidenceDowngraded: false,
  };

  // Known legitimate authority patterns by region
  const legitimateAuthorities = {
    eu: [
      "european commission",
      "directorate-general for maritime affairs",
      "eu common fisheries policy",
      "commission regulation",
    ],
    spain: [
      "ministry of agriculture, fisheries and food",
      "gobierno de españa",
      "real decreto",
    ],
    malta: [
      "department of fisheries and aquaculture",
      "malta environment and planning authority",
      "legal notice",
    ],
    cyprus: [
      "department of fisheries and marine research",
      "ministry of agriculture",
      "cyprus fisheries law",
    ],
    greece: ["ministry of rural development and food", "hellenic republic"],
    italy: [
      "ministry of agricultural, food and forestry policies",
      "decreto legislativo",
    ],
  };

  // Suspicious patterns that indicate potential hallucination
  const suspiciousPatterns = [
    /regulation no\. \d{4}\/\d{4}/i, // Generic regulation patterns
    /article \d+, section \d+/i, // Generic article references
    /law \d{3}\(i\)\/\d{4}/i, // Specific Cyprus law pattern that might be fabricated
    /royal decree \d+\/\d{4}/i, // Generic royal decree patterns
    /legal notice \d+ of \d{4}/i, // Generic legal notice patterns
  ];

  // Generic terms that should be replaced
  const genericTerms = [
    "local regulations",
    "government authority",
    "fishing authority",
    "marine authority",
    "unknown",
    "not specified",
  ];

  // Function to validate a single regulation entry
  const validateRegulationEntry = (entry: any, fieldName: string) => {
    if (!entry || typeof entry !== "object") {
      return {
        value: "Check with local authorities",
        source: `Contact local fisheries authority in ${location}`,
        confidence: "Low",
      };
    }

    let { value, source, confidence } = entry;
    let wasModified = false;

    // Check for suspicious patterns in source
    if (source && typeof source === "string") {
      const sourceLower = source.toLowerCase();

      // Check for generic terms
      const hasGenericTerms = genericTerms.some((term) =>
        sourceLower.includes(term.toLowerCase()),
      );

      // Check for suspicious regulation patterns
      const hasSuspiciousPatterns = suspiciousPatterns.some((pattern) =>
        pattern.test(source),
      );

      // Check if source contains legitimate authority references
      const hasLegitimateAuthority = Object.values(legitimateAuthorities)
        .flat()
        .some((auth) => sourceLower.includes(auth.toLowerCase()));

      if (hasGenericTerms || hasSuspiciousPatterns || !hasLegitimateAuthority) {
        // Replace with safe fallback
        source = `Contact local fisheries authority in ${location} for current regulations`;
        confidence = "Low";
        wasModified = true;
        validationFlags.suspiciousSourcesDetected = true;

        if (hasGenericTerms) {
          validationFlags.genericSourcesReplaced = true;
        }
      }
    }

    // Ensure confidence is appropriately conservative
    if (
      confidence === "High" &&
      !source.toLowerCase().includes("european commission")
    ) {
      confidence = "Medium";
      validationFlags.confidenceDowngraded = true;
      wasModified = true;
    }

    // If value seems too specific without high confidence, make it more general
    if (
      confidence === "Low" &&
      value &&
      typeof value === "string" &&
      (value.includes("cm") || value.includes("per day") || value.includes("€"))
    ) {
      value = "Check with local authorities";
      wasModified = true;
    }

    if (wasModified) {
      console.warn(
        `⚠️ Regulation validation: Modified ${fieldName} due to suspicious content`,
        { original: entry, modified: { value, source, confidence } },
      );
    }

    return { value, source, confidence };
  };

  // Validate each regulation field
  validatedRegulations.sizeLimit = validateRegulationEntry(
    regulations.sizeLimit,
    "sizeLimit",
  );
  validatedRegulations.bagLimit = validateRegulationEntry(
    regulations.bagLimit,
    "bagLimit",
  );
  validatedRegulations.seasonDates = validateRegulationEntry(
    regulations.seasonDates,
    "seasonDates",
  );
  validatedRegulations.licenseRequired = validateRegulationEntry(
    regulations.licenseRequired,
    "licenseRequired",
  );
  validatedRegulations.penalties = validateRegulationEntry(
    regulations.penalties,
    "penalties",
  );

  // Validate additional rules
  if (
    regulations.additionalRules &&
    Array.isArray(regulations.additionalRules)
  ) {
    validatedRegulations.additionalRules = regulations.additionalRules
      .map((rule: any, index: number) =>
        validateRegulationEntry(rule, `additionalRule${index}`),
      )
      .filter((rule: any) => rule.value !== "Check with local authorities"); // Remove generic additional rules
  } else {
    validatedRegulations.additionalRules = [];
  }

  // Add validation metadata
  validatedRegulations.validationFlags = validationFlags;
  validatedRegulations.lastValidated = new Date().toISOString();

  // Log validation results
  if (
    validationFlags.suspiciousSourcesDetected ||
    validationFlags.genericSourcesReplaced ||
    validationFlags.confidenceDowngraded
  ) {
    console.warn(
      "🛡️ Regulation validation detected and corrected potential AI hallucination:",
      validationFlags,
    );
  }

  return validatedRegulations;
};
