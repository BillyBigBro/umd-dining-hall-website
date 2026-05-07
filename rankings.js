const rankingGrid = document.getElementById("rankingGrid");
const weeklyRankingGrid = document.getElementById("weeklyRankingGrid");
const API_BASE = "https://umd-dining-hall-website-production.up.railway.app";

function renderRankings(target, items, emptyMessage) {
  if (!items || items.length === 0) {
    target.innerHTML = `
      <tr>
        <td class="ranking-empty" colspan="3">${emptyMessage}</td>
      </tr>
    `;
    return;
  }

  target.innerHTML = items
    .map((item, index) => {
      const name = item.food_name || "Unknown";
      const count = item.search_count ?? 0;
      const label = count === 1 ? "search" : "searches";
      const url = item.url || "";
      const linkStart = url
        ? `<a class=\"details-link\" href=\"${url}\" target=\"_blank\" rel=\"noopener noreferrer\">`
        : "";
      const linkEnd = url ? "</a>" : "";
      const highlightClass = index < 3 ? `ranking-top-${index + 1}` : "";
      return `
        <tr class="${highlightClass}">
          <td class="ranking-rank">#${index + 1}</td>
          <td class="ranking-name">${linkStart}${name}${linkEnd}</td>
          <td class="ranking-meta">${count} ${label}</td>
        </tr>
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
    rankingGrid.innerHTML = "<tr><td class=\"ranking-empty\" colspan=\"3\">Rankings aren't working right now. Check back later!</td></tr>";
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
    weeklyRankingGrid.innerHTML = "<tr><td class=\"ranking-empty\" colspan=\"3\">Weekly rankings aren't working right now. Check back later!</td></tr>";
  }
}

loadRankings();
loadWeeklyRankings();
