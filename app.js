const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const results = document.getElementById("results");
const details = document.getElementById("details");

let foods = [];

const nutritionHeaders = [
  "Serving Size",
  "Calories",
  "Total Fat (g)",
  "Saturated Fat (g)",
  "Trans Fat (g)",
  "Cholesterol (mg)",
  "Sodium (mg)",
  "Total Carbohydrate (g)",
  "Dietary Fiber (g)",
  "Total Sugars (g)",
  "Added Sugars (g)",
  "Protein (g)",
  "Calcium (mg)",
  "Iron (mg)",
  "Potassium (mg)",
  "Vitamin A (mcg)",
  "Vitamin C (mg)",
  "Soluble Fiber (g)",
  "Insoluble Fiber (g)",
];

const highlightClassByLabel = {
  "Calories": "nutrition-row-highlight",
  "Total Fat (g)": "nutrition-row-fat",
  "Total Carbohydrate (g)": "nutrition-row-carb",
  "Protein (g)": "nutrition-row-protein",
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length > 0 || row.length > 0) {
        row.push(current);
        rows.push(row);
        row = [];
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function renderResults(list) {
  results.innerHTML = "";

  if (list.length === 0) {
    results.innerHTML = "<div class=\"search-result\">No matches</div>";
    return;
  }

  list.slice(0, 12).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = item.food_name;
    button.addEventListener("click", () => showDetails(item));
    results.appendChild(button);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = Number.parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(startHex, endHex, t) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  return rgbToHex({
    r: lerp(start.r, end.r, t),
    g: lerp(start.g, end.g, t),
    b: lerp(start.b, end.b, t),
  });
}

function darken(hex, amount) {
  const color = hexToRgb(hex);
  return rgbToHex({
    r: Math.max(0, Math.round(color.r * (1 - amount))),
    g: Math.max(0, Math.round(color.g * (1 - amount))),
    b: Math.max(0, Math.round(color.b * (1 - amount))),
  });
}

function getGradientForValue(value, goodLow, badHigh) {
  const green = "#2a8843";
  const red = "#cc0000";
  const t = clamp((value - goodLow) / (badHigh - goodLow), 0, 1);
  const base = mixColors(green, red, t);
  return {
    start: base,
    end: darken(base, 0.15),
  };
}

function getGradientForValueReverse(value, badLow, goodHigh) {
  const green = "#2a8843";
  const red = "#cc0000";
  const t = clamp((value - badLow) / (goodHigh - badLow), 0, 1);
  const base = mixColors(red, green, t);
  return {
    start: base,
    end: darken(base, 0.15),
  };
}

function showDetails(item) {
  const servingSizeText = (item.serving_size || "").toLowerCase();
  const servingMatch = servingSizeText.match(/\d+(?:\.\d+)?/);
  const servingAmount = servingMatch ? Number.parseFloat(servingMatch[0]) : 0;
  const isOneOunce = servingSizeText.includes("oz") && servingAmount === 1;

  const calories = Number.parseFloat(item.calories) || 0;
  const protein = Number.parseFloat(item.protein_g) || 0;
  const totalFat = Number.parseFloat(item.total_fat_g) || 0;
  const satFat = Number.parseFloat(item.saturated_fat_g) || 0;

  const calPerOunce = isOneOunce ? calories : 0;
  const calPerProtein = protein > 0 ? calories / protein : 0;
  const proteinPerFat = totalFat > 0 ? protein / totalFat : 0;
  const satFatPercent = totalFat > 0 ? (satFat / totalFat) * 100 : 0;
  const hasFat = totalFat > 0;

  const ratios = [
    {
      label: "Calories:OZ",
      value: isOneOunce ? `${calPerOunce.toFixed(2)} cal/oz` : "-",
      subtitle: "How filling is this?",
      gradient: isOneOunce ? getGradientForValue(calPerOunce, 30, 142) : null,
    },
    {
      label: "Calories:Protein",
      value: calPerProtein > 0 ? calPerProtein.toFixed(2) : "-",
      gradient: calPerProtein > 0 ? getGradientForValue(calPerProtein, 4, 50) : null,
    },
    {
      label: "Protein:Fat",
      value: proteinPerFat > 0 ? proteinPerFat.toFixed(2) : "-",
      gradient: proteinPerFat > 0
        ? getGradientForValueReverse(proteinPerFat, 0, 2)
        : null,
    },
    {
      label: "Sat Fat/Fat (%)",
      value: hasFat ? `${satFatPercent.toFixed(1)}%` : "0.0%",
      gradient: getGradientForValue(satFatPercent, 0, 100),
    },
  ];

  const ratioCards = ratios
    .map((ratio) => {
      const subtitle = ratio.subtitle
        ? `<div class="ratio-subtitle">${ratio.subtitle}</div>`
        : "";
      const style = ratio.gradient
        ? `style="--ratio-start: ${ratio.gradient.start}; --ratio-end: ${ratio.gradient.end};"`
        : "";
      const valueClass = ratio.gradient ? "ratio-value ratio-gradient" : "ratio-value";
      return `
        <div class="ratio-card">
          <div class="ratio-label">${ratio.label}</div>
          <div class="${valueClass}" ${style}>${ratio.value}</div>
          ${subtitle}
        </div>
      `;
    })
    .join("");

  const nutritionValues = [
    item.serving_size,
    item.calories,
    item.total_fat_g,
    item.saturated_fat_g,
    item.trans_fat_g,
    item.cholesterol_mg,
    item.sodium_mg,
    item.total_carbohydrate_g,
    item.dietary_fiber_g,
    item.total_sugars_g,
    item.added_sugars_g,
    item.protein_g,
    item.calcium_mg,
    item.iron_mg,
    item.potassium_mg,
    item.vitamin_a_mcg,
    item.vitamin_c_mg,
    item.soluble_fiber_g,
    item.insoluble_fiber_g,
  ];

  const rows = nutritionValues
    .map((value, index) => {
      const label = nutritionHeaders[index];
      const highlightClass = highlightClassByLabel[label] || "";
      return `<tr class="${highlightClass}"><th>${label}</th><td>${
        value || "-"
      }</td></tr>`;
    })
    .join("");

  details.innerHTML = `
    <div class="details-card fade-in-up">
      <h2 class="details-title">
        <a class="details-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
          ${item.food_name}
        </a>
      </h2>
      <div class="ratio-grid">
        ${ratioCards}
      </div>
      <table class="nutrition-table">
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="ingredients">
        <strong>Ingredients:</strong>
        <div>${item.ingredients || "Not listed."}</div>
      </div>
    </div>
  `;

  results.innerHTML = "";
}

function normalize(text) {
  return text.toLowerCase().trim();
}

function performSearch() {
  const query = normalize(searchInput.value);
  if (!query) {
    results.innerHTML = "";
    return;
  }
  const filtered = foods.filter(
    (item) => item.food_name && normalize(item.food_name).includes(query)
  );
  renderResults(filtered);
}

async function loadData() {
  const response = await fetch("working_filled.csv");
  const text = await response.text();
  const rows = parseCSV(text);
  const headers = rows.shift();

  foods = rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] || "";
    });
    return item;
  });

}

searchInput.addEventListener("input", performSearch);
searchButton.addEventListener("click", performSearch);

loadData();
