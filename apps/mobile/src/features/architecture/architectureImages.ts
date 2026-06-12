export const ARCHITECTURE_IMAGES: Record<string, any> = {
  forum: require("../../../assets/architecture/forum.jpg"),
};

export function getArchitectureDetailImage(detailValue: string) {
  // Try to match the exact value. E.g. "forum", "glassCubeFlagship"
  return ARCHITECTURE_IMAGES[detailValue];
}
