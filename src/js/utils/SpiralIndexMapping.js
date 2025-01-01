// Function to convert (x, y) to spiral index
export function xyToIndex(x, y) {
    if (x === 0 && y === 0) return 1; // Special case for the origin

    // Determine the "ring" (or "layer")
    const layer = Math.max(Math.abs(x), Math.abs(y));

    // Calculate the starting index of this layer
    let startIndex = 1 + (2 * layer - 1) ** 2;

    // Determine the position on the layer
    const layerSize = 2 * layer; // Size of one side of the layer

    if (x === -layer && y > -layer) {
        // Left side
        return startIndex + (layer - y);
    } else if (y === -layer && x < layer) {
        // Bottom side
        return startIndex + layerSize + (layer + x);
    } else if (x === layer && y < layer) {
        // Right side
        return startIndex + 2 * layerSize + (layer + y);
    } else if (y === layer && x > -layer) {
        // Top side
        return startIndex + 3 * layerSize + (layer - x);
    }

    throw new Error("Invalid coordinates: coordinates do not fall on the spiral.");
}

// Function to convert spiral index to (x, y)
export function indexToXy(index) {
    if (index === 1) return [0, 0]; // Special case for the origin

    // Determine the layer of the index
    let layer = Math.ceil((Math.sqrt(index - 1) - 1) / 2);

    // Calculate the starting index of this layer
    let startIndex = 1 + (2 * layer - 1) ** 2;
    let offset = index - startIndex;

    const layerSize = 2 * layer; // Size of one side of the layer

    if (offset < layerSize) {
        // Left side
        return [-layer, layer - offset];
    } else if (offset < 2 * layerSize) {
        // Bottom side
        offset -= layerSize;
        return [-layer + offset, -layer];
    } else if (offset < 3 * layerSize) {
        // Right side
        offset -= 2 * layerSize;
        return [layer, -layer + offset];
    } else {
        // Top side
        offset -= 3 * layerSize;
        return [layer - offset, layer];
    }
}