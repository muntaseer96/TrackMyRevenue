import { BookOpen, Star } from 'lucide-react'

interface QuoteCardProps {
  source: string
  reference: string
  text: string
  type: 'quran' | 'hadith'
}

function QuoteCard({ source, reference, text, type }: QuoteCardProps) {
  const isQuran = type === 'quran'
  return (
    <div className={`rounded-lg border p-5 ${isQuran ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        {isQuran ? (
          <BookOpen className="w-4 h-4 text-emerald-700" />
        ) : (
          <Star className="w-4 h-4 text-amber-700" />
        )}
        <span className={`text-xs font-semibold uppercase tracking-wide ${isQuran ? 'text-emerald-700' : 'text-amber-700'}`}>
          {source}
        </span>
      </div>
      <p className="text-gray-800 leading-relaxed italic">
        "{text}"
      </p>
      <p className={`text-xs mt-3 font-medium ${isQuran ? 'text-emerald-600' : 'text-amber-600'}`}>
        — {reference}
      </p>
    </div>
  )
}

const QUOTES: QuoteCardProps[] = [
  {
    type: 'quran',
    source: "Qur'an",
    reference: 'Surah Al-Baqarah 2:267',
    text: 'O you who believe! Spend of the good things which you have earned, and of that which We have produced from the earth for you.',
  },
  {
    type: 'quran',
    source: "Qur'an",
    reference: 'Surah At-Tawbah 9:103',
    text: 'Take from their wealth a charity by which you purify them and cause them increase, and invoke Allah\'s blessings upon them.',
  },
  {
    type: 'quran',
    source: "Qur'an",
    reference: 'Surah Al-Baqarah 2:261',
    text: 'The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven ears; in each ear is a hundred grains. And Allah multiplies His reward for whom He wills.',
  },
  {
    type: 'quran',
    source: "Qur'an",
    reference: 'Surah Ar-Rum 30:39',
    text: 'And whatever you give for Zakat, desiring the countenance of Allah — those are the multipliers.',
  },
  {
    type: 'quran',
    source: "Qur'an",
    reference: 'Surah Al-Baqarah 2:277',
    text: 'Indeed, those who believe and do righteous deeds and establish prayer and give Zakat will have their reward with their Lord, and there will be no fear concerning them, nor will they grieve.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Sahih al-Bukhari 1395',
    text: 'Islam is built upon five pillars: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing the prayer, paying the Zakat, making the pilgrimage to the House, and fasting in Ramadan.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Sahih Muslim 2588',
    text: 'Charity does not decrease wealth. No one forgives another except that Allah increases his honor. And no one humbles himself for the sake of Allah except that Allah raises his status.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Sahih al-Bukhari 1410',
    text: 'Whoever is made wealthy by Allah and does not pay the Zakat of his wealth, then on the Day of Resurrection his wealth will be made like a bald-headed poisonous male snake with two black spots over the eyes.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Sunan Ibn Majah 1783',
    text: 'Pay Zakat on your wealth, for it is a purifier that purifies you.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Sahih al-Bukhari 1442',
    text: 'The upper hand is better than the lower hand. The upper hand is the one that gives, and the lower hand is the one that receives.',
  },
  {
    type: 'hadith',
    source: 'Hadith',
    reference: 'Jami at-Tirmidhi 2325',
    text: 'The son of Adam says: "My wealth, my wealth!" But do you get anything from your wealth except what you eat and consume, what you wear and wear out, or what you give in charity and thus store up?',
  },
]

export function ZakatEncouragement() {
  const quranQuotes = QUOTES.filter(q => q.type === 'quran')
  const hadithQuotes = QUOTES.filter(q => q.type === 'hadith')

  return (
    <div className="space-y-8">
      {/* Quran Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" />
          From the Qur'an
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quranQuotes.map((q, i) => (
            <QuoteCard key={i} {...q} />
          ))}
        </div>
      </div>

      {/* Hadith Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-700" />
          From the Hadith
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hadithQuotes.map((q, i) => (
            <QuoteCard key={i} {...q} />
          ))}
        </div>
      </div>
    </div>
  )
}
