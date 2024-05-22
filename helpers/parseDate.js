export function parseDate(dt) {
    let mainSplit = dt.split(", ");
    let yearParts = mainSplit[0].split("/");
    return `${yearParts[2]}-${yearParts[1]}-${yearParts[0]} ${mainSplit[1]}`;
}