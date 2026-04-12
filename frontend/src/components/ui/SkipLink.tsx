/**
 * Link de pular para conteúdo — acessibilidade WCAG 2.1 AA.
 * Aparece com Tab, fica invisível normalmente.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-lilac focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
    >
      Pular para conteudo principal
    </a>
  );
}
