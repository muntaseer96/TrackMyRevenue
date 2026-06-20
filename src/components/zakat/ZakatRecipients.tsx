import { Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface RecipientCategory {
  number: number
  arabic: string
  english: string
  description: string
  example: string
}

const CATEGORIES: RecipientCategory[] = [
  {
    number: 1,
    arabic: 'Al-Fuqarā',
    english: 'The Poor',
    description: 'Those with little to no income who cannot meet their basic needs (food, clothing, shelter).',
    example: 'A rickshaw-puller, day labourer, or domestic helper who genuinely struggles to get by — like the "rickshawala mama" you gave to.',
  },
  {
    number: 2,
    arabic: 'Al-Masākīn',
    english: 'The Needy',
    description: 'Those who have some income but not enough to cover their essential needs. The core of your Zakat goes here and to the poor.',
    example: 'Your office cleaning khala, the building security guard (darowan), or a driver whose wages don\'t cover his family\'s needs — provided this is a gift on top of their pay, not the pay itself.',
  },
  {
    number: 3,
    arabic: 'Al-ʿĀmilīn ʿalayhā',
    english: 'Zakat Administrators',
    description: 'Those appointed to collect and distribute Zakat — their operational/admin costs may be paid from it.',
    example: 'The portion a trustworthy Zakat-collecting charity (e.g. As-Sunnah, Mastul) uses to run its distribution. Usually not something you pay individuals for directly.',
  },
  {
    number: 4,
    arabic: 'Al-Muʾallafah Qulūbuhum',
    english: 'Hearts to be Reconciled',
    description: 'New Muslims or those inclined towards Islam who need support to strengthen their faith or ties.',
    example: 'Supporting a recent convert facing hardship or family rejection. (Some scholars consider this category narrowed today — ask if unsure.)',
  },
  {
    number: 5,
    arabic: 'Fir-Riqāb',
    english: 'Freeing the Captive',
    description: 'Historically freeing slaves; today commonly applied to freeing people from bondage, trafficking, or unjust captivity.',
    example: 'Contributing to a verified effort that ransoms or frees people held in bondage or trafficking.',
  },
  {
    number: 6,
    arabic: 'Al-Ghārimīn',
    english: 'Those in Debt',
    description: 'People burdened by debt taken for a lawful need, who cannot repay it themselves.',
    example: 'A relative or employee drowning in medical or household debt — e.g. helping the office khala toward her daughter\'s wedding costs if she\'s genuinely in need.',
  },
  {
    number: 7,
    arabic: 'Fī Sabīlillāh',
    english: 'In the Cause of Allah',
    description: 'Those striving in Allah\'s path; broadly interpreted by many scholars to include da\'wah, Islamic education, and relief work.',
    example: 'Relief for orphans and families in Gaza (your MATW payment), or supporting Islamic education/relief. Note: most scholars say general mosque construction does NOT qualify.',
  },
  {
    number: 8,
    arabic: 'Ibn as-Sabīl',
    english: 'The Stranded Traveler',
    description: 'A traveller cut off from their wealth and stranded, even if they are wealthy back home.',
    example: 'A stranded migrant worker or traveller who has run out of money far from home and needs help to get by or return.',
  },
]

const ALLOWED = [
  'Needy relatives who are NOT your dependents — e.g. an uncle (chacha), father-in-law, cousin, or adult sibling in need. This is more rewarding (charity + upholding kinship).',
  'Giving through a trustworthy foundation (MATW, As-Sunnah, Mastul) — valid as long as it reaches eligible recipients. Tell them it\'s Zakat so it goes to their Zakat fund.',
  'Giving without telling the recipient it is Zakat — only your intention (niyyah) is required.',
]

const AVOID = [
  'Your own parents, grandparents, children, grandchildren, or spouse — you are already responsible for them, so Zakat to them is not valid.',
  'Counting your staff\'s salary/wages as Zakat. Zakat to a driver, guard, or khala must be an EXTRA gift beyond their pay — and they must genuinely be needy.',
  'Giving the poor-category Zakat to non-Muslims (per the majority). Helping needy non-Muslims is rewarded ṣadaqah, but does not count as Zakat.',
  'Descendants of the Prophet ﷺ (Banū Hāshim / sayyids) — many scholars hold they cannot receive Zakat.',
  'General "good causes" like building a mosque — disputed, and the majority do not count it as valid Zakat.',
]

export function ZakatRecipients() {
  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-emerald-700" />
          The 8 Eligible Recipients of Zakat
        </h3>
        <p className="text-sm text-emerald-800 leading-relaxed">
          Allah named exactly eight categories who may receive Zakat in the Qur'an:
        </p>
        <p className="text-sm text-emerald-800 italic leading-relaxed mt-2">
          "Zakat is only for the poor and the needy, and those employed to administer it, and those whose
          hearts are to be reconciled, and to free the captives, and for those in debt, and for the cause
          of Allah, and for the stranded traveler — an obligation imposed by Allah."
        </p>
        <p className="text-xs text-emerald-600 font-medium mt-2">— Surah At-Tawbah 9:60</p>
      </div>

      {/* The 8 categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.number} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                {cat.number}
              </div>
              <div className="space-y-1.5">
                <div>
                  <p className="font-semibold text-gray-900">{cat.english}</p>
                  <p className="text-xs text-gray-400 italic">{cat.arabic}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{cat.description}</p>
                <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 mt-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">For you</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{cat.example}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Allowed */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Good to know — these are fine
        </h3>
        <ul className="space-y-2.5">
          {ALLOWED.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avoid */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-5">
        <h3 className="text-base font-semibold text-red-900 flex items-center gap-2 mb-3">
          <XCircle className="w-5 h-5 text-red-600" />
          Common mistakes to avoid
        </h3>
        <ul className="space-y-2.5">
          {AVOID.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-red-800 leading-relaxed">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* "Ammu" / family conduit caveat — tied to the user's past giving */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 leading-relaxed space-y-1.5">
          <p className="font-semibold">A note on giving through family (e.g. "to Ammu for the village")</p>
          <p>
            You cannot give Zakat <span className="font-medium">to</span> your own mother/father — but you
            <span className="font-medium"> can</span> hand money to a parent to <span className="font-medium">distribute on your behalf</span> to
            eligible poor people. Just make sure it actually reaches eligible recipients and isn't kept as
            their own. The intention that it's Zakat stays with you.
          </p>
        </div>
      </div>

      {/* Scholar caveat */}
      <p className="text-xs text-gray-500 italic leading-relaxed">
        This is general guidance following the majority of scholars, not a formal fatwa. Schools of thought
        differ on some details (especially categories 4 and 7). For your specific cases, confirm with a
        trusted scholar or mufti.
      </p>
    </div>
  )
}
