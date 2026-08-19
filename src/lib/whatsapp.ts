import { getStudioWhatsApp } from "./studio-settings";

/** Telefone do estúdio usado nos links de WhatsApp da cliente (formato internacional, só dígitos). */
export const STUDIO_WHATSAPP = "5537991377328";

export function getActiveStudioWhatsApp(): string {
  return getStudioWhatsApp();
}

function digits(phone: string) {
  const only = phone.replace(/\D/g, "");
  if (!only) return "";
  return only.startsWith("55") ? only : `55${only}`;
}

export function formatClientPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const only = phone.replace(/\D/g, "");
  if (!only) return phone.trim();

  if (only.startsWith("55") && only.length === 13) {
    const ddd = only.slice(2, 4);
    const part1 = only.slice(4, 9);
    const part2 = only.slice(9, 13);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (only.startsWith("55") && only.length === 12) {
    const ddd = only.slice(2, 4);
    const part1 = only.slice(4, 8);
    const part2 = only.slice(8, 12);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (only.length === 11) {
    const ddd = only.slice(0, 2);
    const part1 = only.slice(2, 7);
    const part2 = only.slice(7, 11);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (only.length === 10) {
    const ddd = only.slice(0, 2);
    const part1 = only.slice(2, 6);
    const part2 = only.slice(6, 10);
    return `(${ddd}) ${part1}-${part2}`;
  }
  return phone;
}

export function whatsappDirectLink(phone: string) {
  const number = digits(phone);
  return number ? `https://wa.me/${number}` : "";
}

export function whatsappLink(phone: string, message: string) {
  const number = digits(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function identityPhotosMessage(params: { clientName: string; orderNumber: number }) {
  return [
    `Oi, ${params.clientName}! Aqui é do estúdio (pedido #${params.orderNumber}).`,
    "",
    "Para começarmos a produção, precisamos das suas fotos de identidade:",
    "• 3 a 5 fotos suas de rosto, bem iluminadas e sem filtro",
    "• 1 foto de corpo inteiro",
    "",
    "É dessas fotos que vem o seu rosto nas imagens finais.",
  ].join("\n");
}

export function configuratorLinkMessage(params: {
  clientName: string;
  orderNumber: number;
  link: string;
}) {
  return [
    `Oi, ${params.clientName}! Aqui é do estúdio (pedido #${params.orderNumber}).`,
    "",
    "Monte o seu ensaio neste link — leva poucos minutos:",
    params.link,
  ].join("\n");
}

export function clientSendPhotosMessage(params: { clientName: string; orderNumber: number }) {
  return [
    `Olá! Sou ${params.clientName} (pedido #${params.orderNumber}).`,
    "Acabei de enviar a configuração do meu ensaio e vou mandar as minhas fotos de identidade aqui.",
  ].join("\n");
}
