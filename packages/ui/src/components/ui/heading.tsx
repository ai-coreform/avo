interface HeadingProps {
  title: string;
  description: string;
  ctaButton?: React.ReactNode;
  ctaButton2?: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  ctaButton,
  ctaButton2,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <h2 className="font-bold text-3xl tracking-tight">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    {ctaButton ? <div>{ctaButton}</div> : null}
    {ctaButton2 ? <div>{ctaButton2}</div> : null}
  </div>
);
