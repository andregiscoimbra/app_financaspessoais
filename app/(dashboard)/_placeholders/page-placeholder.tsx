import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export function PagePlaceholder({ title, phase, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta seção será implementada na <strong>{phase}</strong>. Por enquanto,
          a estrutura de navegação está pronta.
        </CardContent>
      </Card>
    </div>
  );
}
