'use client';

import { useState } from 'react';
import { BadgeDollarSign, Gift, LockKeyhole, Palette, Shirt, PartyPopper, ChevronDown, Zap } from 'lucide-react';

const RULES = [
  {
    title: 'One Person. One Shirt.',
    text: "You'll be randomly assigned one person from the group. Your mission? Find them a hilarious T-shirt they'll have to rock at the pregame and concert.",
    Icon: Gift,
    style: 'violet',
  },
  {
    title: 'Budget: $25–$40',
    text: "Keep your shirt within the $25–$40 range. You don't need to break the bank to make someone look ridiculous.",
    Icon: BadgeDollarSign,
    style: 'cyan',
  },
  {
    title: 'No Spoilers. No Swaps.',
    text: 'Keep your assignment a SECRET until the exchange! No telling anyone who you got, and absolutely no trading assignments.',
    Icon: LockKeyhole,
    style: 'pink',
  },
  {
    title: 'Make It Personal',
    text: 'The best shirts are the ones that hit close to home. Inside jokes, embarrassing references, and friendly roasts are highly encouraged. Put some thought into it!',
    Icon: Palette,
    style: 'pink',
  },
  {
    title: 'Pregame = Shirt Exchange',
    text: "Bring your shirt to the pregame! That's when everyone will exchange shirts and find out who got them what.",
    Icon: PartyPopper,
    style: 'violet',
  },
  {
    title: 'You HAVE to Wear It',
    text: "Whatever shirt you receive, you're wearing it to the concert. No exceptions. No backing out. Embrace the embarrassment.",
    Icon: Shirt,
    style: 'cyan',
  },
] as const;

export function ExchangeRules() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rave-rules" aria-labelledby="rave-rules-heading">
      <header className="rave-rules-header">
        <div className="rave-rules-heading">
          <div className="rave-rules-eyebrow"><Zap size={14}/> THE EXCHANGE CODE</div>
          <h2 id="rave-rules-heading">THE RAVE <span>RULES</span></h2>
          <p>Six commandments of the T-shirt exchange. Read these before the draw.</p>
        </div>
        <span className="rave-rules-count">6 GOLDEN RULES</span>
        <button
          type="button"
          className="rave-rules-toggle"
          aria-expanded={expanded}
          aria-controls="rave-rules-list"
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? 'Hide rules' : 'View all 6 rules'}
          <ChevronDown size={17} className={expanded ? 'is-rotated' : ''}/>
        </button>
      </header>
      <div id="rave-rules-list" className={`rave-rules-list ${expanded ? 'is-expanded' : ''}`}>
        {RULES.map(({ title, text, Icon, style }, index) => (
          <article className={`rave-rule rave-rule-${style}`} key={title}>
            <div className="rave-rule-top">
              <span className="rave-rule-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="rave-rule-icon"><Icon size={19}/></span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
