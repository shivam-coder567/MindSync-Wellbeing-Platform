import HexTile from "./HexTile";
import type { InfinityTile as TileData, ThemeColors } from "./hexTypes";
interface Props {
  tile: TileData;
  theme: ThemeColors;
  tileSize: number;
  isSelected?: boolean;
  isHint?: boolean;
  onRotate: (q: number, r: number) => void;
}
export default function InfinityTile({
  tile,
  theme,
  tileSize,
  isSelected,
  isHint,
  onRotate,
}: Props) {
  return (
    <HexTile
      hex={tile.hex}
      currentMask={tile.mask}
      solvedMask={tile.solvedMask}
      rotation={tile.rotation}
      theme={theme}
      tileSize={tileSize}
      isSelected={isSelected}
      isHint={isHint}
      onRotate={onRotate}
    />
  );
}
