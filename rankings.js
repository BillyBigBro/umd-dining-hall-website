const rankingGrid = document.getElementById("rankingGrid");

function renderRankings(items) {
  if (!items || items.length === 0) {
    rankingGrid.innerHTML = "<div class=\"ranking-card\">No searches yet.</div>";
    return;
  }

  rankingGrid.innerHTML = items
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
    const response = await fetch("/api/top-searches?limit=10");
    if (!response.ok) {
      throw new Error("Failed to load rankings");
    }
    const data = await response.json();
    renderRankings(data.items || []);
  } catch (error) {
    rankingGrid.innerHTML = "<div class=\"ranking-card\">Unable to load rankings.</div>";
  }
}

loadRankings();
