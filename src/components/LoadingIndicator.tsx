interface LoadingIndicatorProps {
  progress: number;
  message: string;
  history: string[];
  isActive: boolean;
}

const LoadingIndicator = ({ progress, message, history, isActive }: LoadingIndicatorProps) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{message || "Prêt à lancer une nouvelle génération"}</span>
        {isActive && <span className="font-medium text-foreground">{clampedProgress}%</span>}
      </div>

      {isActive && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      {history.length > 0 && (
        <ul className="space-y-2 text-sm">
          {history.map((item, index) => {
            const isLatest = index === history.length - 1;

            return (
              <li
                key={`${item}-${index}`}
                className={`flex items-start gap-2 ${
                  isLatest ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`mt-1 h-2 w-2 rounded-full ${
                    isLatest ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
                <span className="leading-snug">{item}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LoadingIndicator;
