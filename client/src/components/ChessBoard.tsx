import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  fen: string;
  onPieceDrop: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  boardOrientation: 'white' | 'black';
  disabled?: boolean;
  customSquareStyles?: Record<string, React.CSSProperties>;
}

export default function ChessBoard({
  fen,
  onPieceDrop,
  boardOrientation,
  disabled = false,
  customSquareStyles = {},
}: ChessBoardProps) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 560,
      aspectRatio: '1/1',
      margin: '0 auto',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: '4px solid var(--border)',
    }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation,
          allowDragging: !disabled,
          squareStyles: customSquareStyles,
          darkSquareStyle: { backgroundColor: '#2b3648' },
          lightSquareStyle: { backgroundColor: '#4a5568' },
          animationDurationInMs: 200,
          onPieceDrop: ({ sourceSquare, targetSquare, piece }) => {
            if (!targetSquare) return false;
            return onPieceDrop(sourceSquare, targetSquare, piece.pieceType);
          },
        }}
      />
    </div>
  );
}
