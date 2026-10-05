import { Fragment } from "react";
import { Text, Tooltip } from "@mantine/core";
import { GLOSSARY } from "../rules.js";

/* Rule statements carry {braced} jargon. Each becomes an underlined span with
   the definition on hover — the terms stay, which is the point, but looking one
   up never costs you the sentence you were reading. */

export function Glossed({ children, size = "sm", ...rest }) {
  const text = String(children ?? "");
  const parts = text.split(/(\{[^}]+\})/g).filter(Boolean);

  return (
    <Text size={size} {...rest}>
      {parts.map((part, i) => {
        const match = part.match(/^\{([^}]+)\}$/);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const term = match[1];
        const definition = GLOSSARY[term];
        if (!definition) return <Fragment key={i}>{term}</Fragment>;
        return (
          <Tooltip
            key={i}
            label={definition}
            multiline
            w={300}
            withArrow
            events={{ hover: true, focus: true, touch: true }}
          >
            <Text component="span" className="glossed" tabIndex={0}>{term}</Text>
          </Tooltip>
        );
      })}
    </Text>
  );
}
