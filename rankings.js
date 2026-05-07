const rankingGrid = document.getElementById("rankingGrid");
const weeklyRankingGrid = document.getElementById("weeklyRankingGrid");
const API_BASE = "https://umd-dining-hall-website-production.up.railway.app";

function renderRankings(target, items, emptyMessage) {
  if (!items || items.length === 0) {
    target.innerHTML = `<div class="ranking-card">${emptyMessage}</div>`;
    return;
  }

  target.innerHTML = items
    .map((item, index) => {
      const name = item.food_name || "Unknown";
      const count = item.search_count ?? 0;
      const url = item.url || "";
      const linkStart = url ? `<a class=\"details-link\" href=\"${url}\" target=\"_blank\" rel=\"noopener noreferrer\">` : "";
      const linkEnd = url ? "</a>" : "";
      return `
        <div class="ranking-card">
          <div class="ranking-rank">#${index + 1}</div>
          <div class="ranking-name">${linkStart}${name}${linkEnd}</div>
          <div class="ranking-meta">${count} searches</div>
        </div>
      `;
    })
    .join("");
}

async function loadRankings() {
  try {
    const response = await fetch(`${API_BASE}/api/top-searches?limit=10`);
    if (!response.ok) {
      throw new Error("Failed to load rankings");
    }
    const data = await response.json();
    renderRankings(rankingGrid, data.items || [], "No searches yet.");
  } catch (error) {
    rankingGrid.innerHTML = "<div class=\"ranking-card\">Rankings aren't working right now. Check back later!</div>";
  }
}

async function loadWeeklyRankings() {
  try {
    const response = await fetch(`${API_BASE}/api/top-searches-weekly?limit=10`);
    if (!response.ok) {
      throw new Error("Failed to load weekly rankings");
    }
    const data = await response.json();
    renderRankings(weeklyRankingGrid, data.items || [], "No searches yet this week.");
  } catch (error) {
    weeklyRankingGrid.innerHTML = "<div class=\"ranking-card\">Weekly rankings aren't working right now. Check back later!</div>";
  }
}

loadRankings();
loadWeeklyRankings();
