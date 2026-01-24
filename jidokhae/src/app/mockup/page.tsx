'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf, Sun, ArrowRight } from 'lucide-react'

const mockups = [
  {
    id: 'olive',
    title: 'Intellectual Luxury',
    subtitle: 'Deep Olive',
    description: '지적이고 고급스러운 분위기. 미니멀하고 여백이 충분한 디자인.',
    icon: Leaf,
    colors: {
      primary: '#3A4A3F',
      bg: '#FFFFFF',
      text: '#2C3330',
    },
  },
  {
    id: 'terracotta',
    title: 'Warm Connection',
    subtitle: 'Terracotta',
    description: '따뜻하고 친근한 분위기. 예술적이고 커뮤니티 중심의 디자인.',
    icon: Sun,
    colors: {
      primary: '#B85C38',
      bg: '#FAFAF9',
      text: '#2D3436',
    },
  },
]

export default function MockupIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Design Mockups
          </h1>
          <p className="text-gray-600">
            지독해 앱의 두 가지 디자인 컨셉을 비교해보세요
          </p>
        </motion.div>

        {/* Mockup Cards */}
        <div className="space-y-6">
          {mockups.map((mockup, index) => {
            const Icon = mockup.icon
            return (
              <motion.div
                key={mockup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/mockup/${mockup.id}`}>
                  <div
                    className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl"
                    style={{ backgroundColor: mockup.colors.bg }}
                  >
                    {/* Color Strip */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: mockup.colors.primary }}
                    />

                    <div className="flex items-start gap-4 pl-4">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${mockup.colors.primary}15` }}
                      >
                        <Icon
                          size={24}
                          style={{ color: mockup.colors.primary }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2
                            className="text-xl font-bold"
                            style={{ color: mockup.colors.text }}
                          >
                            {mockup.title}
                          </h2>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${mockup.colors.primary}20`,
                              color: mockup.colors.primary,
                            }}
                          >
                            {mockup.subtitle}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {mockup.description}
                        </p>

                        {/* Color Preview */}
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: mockup.colors.bg }}
                              title="Background"
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: mockup.colors.primary }}
                              title="Primary"
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: mockup.colors.text }}
                              title="Text"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0 self-center">
                        <ArrowRight
                          size={20}
                          className="text-gray-400 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          모바일 뷰(430px)에 최적화되어 있습니다
        </motion.p>
      </div>
    </div>
  )
}
