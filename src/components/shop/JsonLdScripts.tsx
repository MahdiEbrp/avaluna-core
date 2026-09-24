type Props = {
  nonce: string;
  graphs: unknown[];
};

export function JsonLdScripts({ nonce, graphs }: Props) {
  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
