// Shared run-distance levels for every calendar heatmap and runner heat indicator.
// 0: no run; 1-4: up to 21.1 km; 5: half-marathon-plus; 6: full-marathon-plus.
function levelForDistance(value) {
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "object") return 0;
  if (typeof value === "string" && value.trim() === "") return 0;
  var distance = Number(value);
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  if (distance <= 3) return 1;
  if (distance <= 7) return 2;
  if (distance <= 12) return 3;
  if (distance <= 21.1) return 4;
  if (distance <= 42.2) return 5;
  return 6;
}

module.exports = levelForDistance;
