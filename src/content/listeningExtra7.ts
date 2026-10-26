import type { AudioScript } from './schema'

/**
 * Seventh listening batch: everyday service encounters in four contexts the
 * bank did not yet cover — workplace, travel, retail and community.
 *
 * Each conversation follows the PTE listening formula: a request, some
 * back-and-forth, a constraint or complication, and a resolution built on
 * checkable specifics (numbers, deadlines, conditions, exceptions).
 */
export const EXTRA_CONVERSATIONS_7: AudioScript[] = [
  {
    id: 'con-workplace-training',
    title: 'A course and a client deadline',
    kind: 'conversation',
    topic: 'Workplace services',
    scene: 'An employee asks a manager about a training course and a report deadline.',
    speakers: [
      { id: 'a', name: 'Employee', role: 'Team member', voiceHint: 'mid-high' },
      { id: 'b', name: 'Manager', role: 'Team manager', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I want to ask about two things. The client report is due on Friday, but the data analysis course I was promised starts on Thursday afternoon. Can both work?',
      },
      {
        speaker: 'b',
        text: 'The course runs on Thursday and Friday afternoons, and it is a condition of the new quality standard, so I would rather you went than missed it.',
      },
      {
        speaker: 'a',
        text: 'Then the report slips. The client expects full findings, not a summary, and I cannot produce those in a single morning.',
      },
      {
        speaker: 'b',
        text: 'Move the deadline to Wednesday and tell the client today. A one-day move is inside the tolerance in the contract, and I will confirm it in writing so it is on record.',
      },
      {
        speaker: 'a',
        text: 'What if the course runs over time? The trainer warned that last time it stretched to five o clock.',
      },
      {
        speaker: 'b',
        text: 'If it does, you leave at your normal hour and the second session is recorded. The assessment can be completed within a week of the course, and the trainer signs it off.',
      },
      {
        speaker: 'a',
        text: 'And the cost? I would rather it did not come from the project budget.',
      },
      {
        speaker: 'b',
        text: 'It goes to the central training budget this year, so your project keeps its contingency. Book through the portal and send me the confirmation, and I will note the new deadline on the tracker.',
      },
    ],
    keyTerms: [
      'quality standard',
      'tolerance',
      'in writing',
      'recorded',
      'assessment',
      'central training budget',
    ],
  },
  {
    id: 'con-rail-connection',
    title: 'A rail pass and a connection',
    kind: 'conversation',
    topic: 'Travel services',
    scene: 'A traveller asks a ticket clerk about a rail pass and a tight connection.',
    speakers: [
      { id: 'a', name: 'Traveller', role: 'Passenger', voiceHint: 'high' },
      { id: 'b', name: 'Clerk', role: 'Ticket office', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I am holding a seven-day rail pass and I need to reach the coast on Saturday. Is the pass valid on the coastal line?',
      },
      {
        speaker: 'b',
        text: 'It is, but the pass covers the standard route only. The coastal express also needs a reservation, and reservations are ten pounds per person.',
      },
      {
        speaker: 'a',
        text: 'I have a tight connection at the junction — twenty minutes between the eight-fifteen and the nine-ten. Is that enough?',
      },
      {
        speaker: 'b',
        text: 'Normally it is, because the platform change takes about five minutes. But there is engineering work near the junction this weekend, so the connection moves to platform four and you should allow fifteen.',
      },
      {
        speaker: 'a',
        text: 'Fifteen minutes out of twenty is cutting it fine. What happens if I miss it?',
      },
      {
        speaker: 'b',
        text: 'The next service is forty minutes later and the pass covers it, but only on the same day. Miss the last one and the morning replacement is not included.',
      },
      { speaker: 'a', text: 'Could I travel earlier instead, before the engineering work begins?' },
      {
        speaker: 'b',
        text: 'You can. The seven-ten arrives before the closure starts, and because it is within the pass validity you pay only the reservation. Shall I book that one for you?',
      },
    ],
    keyTerms: [
      'seven-day pass',
      'reservation',
      'engineering work',
      'platform four',
      'forty minutes',
      'closure',
    ],
  },
  {
    id: 'con-shop-exchange',
    title: 'Exchanging a gift without a receipt',
    kind: 'conversation',
    topic: 'Retail services',
    scene: 'A customer asks a shop assistant about exchanging a gift.',
    speakers: [
      { id: 'a', name: 'Customer', role: 'Shopper', voiceHint: 'mid' },
      { id: 'b', name: 'Assistant', role: 'Shop assistant', voiceHint: 'mid-high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I would like to exchange a jacket I was given as a gift. It is the right colour but a size too small, and I do not have a receipt.',
      },
      {
        speaker: 'b',
        text: 'Without a receipt I can offer an exchange or a gift card at the current selling price, not the price paid, and only within the twenty-eight-day window.',
      },
      {
        speaker: 'a',
        text: 'I am within the window. Does this line run small? I would like to try a large instead of a medium.',
      },
      {
        speaker: 'b',
        text: 'It does run small, so a large is the sensible move. We have the large in navy in stock, but not in the grey you are exchanging.',
      },
      { speaker: 'a', text: 'The navy is fine. Is there a difference in price?' },
      {
        speaker: 'b',
        text: 'The grey was in the sale at forty pounds and the navy is full price at fifty-five, so you would pay the difference of fifteen pounds.',
      },
      {
        speaker: 'a',
        text: 'That is fair, though I did not expect the sale price to matter. What if I would rather not pay more?',
      },
      {
        speaker: 'b',
        text: 'Then I issue a gift card for forty pounds, which never expires. Take the navy today and the gift receipt I give you allows thirty days of returns, so you are covered either way.',
      },
    ],
    keyTerms: [
      'receipt',
      'current selling price',
      'twenty-eight-day',
      'gift card',
      'fifteen pounds',
      'gift receipt',
    ],
  },
  {
    id: 'con-street-party',
    title: 'Closing a street for a party',
    kind: 'conversation',
    topic: 'Community services',
    scene: 'A resident phones the council about a road closure for a street party.',
    speakers: [
      { id: 'a', name: 'Resident', role: 'Caller', voiceHint: 'mid-high' },
      { id: 'b', name: 'Officer', role: 'Events officer', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I would like to close our street for a street party on the last Saturday in July, with about forty guests. What do I need to arrange?',
      },
      {
        speaker: 'b',
        text: 'An application at least six weeks ahead. Because that is a busy summer Saturday the bar is higher: we ask for a traffic management plan and public liability insurance.',
      },
      {
        speaker: 'a',
        text: 'Six weeks is tight — the date is five weeks away. Is a late application possible?',
      },
      {
        speaker: 'b',
        text: 'Only if the street is not on a bus route, in which case I can accept it. Which street are you on?',
      },
      {
        speaker: 'a',
        text: 'Willow Lane. No buses, but one resident has a blue badge and needs to reach her driveway.',
      },
      {
        speaker: 'b',
        text: 'Then we keep an access gap in the closure, held clear by marshals you appoint, and we ask you to give every resident a notice seven days ahead, which we supply.',
      },
      { speaker: 'a', text: 'And the cost?' },
      {
        speaker: 'b',
        text: 'Sixty pounds for the closure order and nothing for the notice. Pay online, and the order and the road signs arrive ten days before, provided the insurance certificate reaches us by then.',
      },
    ],
    keyTerms: ['six weeks', 'bus route', 'access gap', 'marshals', 'notice', 'closure order'],
  },
]
