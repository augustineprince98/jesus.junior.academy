'use client';

/**
 * About the School Section
 *
 * Clean design with history, philosophy, and vision/mission/values cards.
 * All content preserved from original.
 */

import { BookOpen, Target, Heart } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            About Our School
          </h2>
          <div className="w-20 h-1 bg-blue-900 mx-auto" />
        </div>

        {/* Main Description */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-gray-700 leading-relaxed text-lg">
            Jesus Junior Academy is committed to nurturing young minds through quality education,
            strong moral values, and a disciplined learning environment. We believe in holistic
            development through academics and co-curricular activities.
          </p>
        </div>

        {/* History & Philosophy Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* History */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-semibold text-blue-900 mb-4">
              Our History
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Founded with a vision to provide quality education rooted in Christian values,
              Jesus Junior Academy has been nurturing young minds and building strong character
              for years. Located in the heart of Rewari, near SBI Bank at Church House, we serve
              as a beacon of educational excellence in the community.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our institution stands on the foundation of truth, integrity, and academic excellence,
              preparing students not just for examinations but for life itself.
            </p>
          </div>

          {/* Philosophy */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-semibold text-blue-900 mb-4">
              Educational Philosophy
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We believe education is more than memorizing facts. It's about developing critical
              thinking, moral values, and a lifelong love for learning. Our curriculum balances
              academic rigor with character development, ensuring students grow into responsible
              citizens.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Every child is unique, and we strive to unlock their potential through personalized
              attention, innovative teaching methods, and a nurturing environment.
            </p>
          </div>
        </div>

        {/* Vision, Mission, Values Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Vision */}
          <div className="bg-white border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-blue-900" />
            </div>
            <h4 className="text-xl font-semibold text-blue-900 mb-3">
              Our Vision
            </h4>
            <p className="text-gray-600 leading-relaxed">
              To be a leading institution that shapes well-rounded individuals who excel
              academically and contribute positively to society with integrity and compassion.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-blue-900" />
            </div>
            <h4 className="text-xl font-semibold text-blue-900 mb-3">
              Our Mission
            </h4>
            <p className="text-gray-600 leading-relaxed">
              To provide a Christ-centered education that nurtures intellectual growth,
              moral values, and practical skills, preparing students for a purposeful life.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-blue-900" />
            </div>
            <h4 className="text-xl font-semibold text-blue-900 mb-3">
              Our Values
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Truth, integrity, compassion, excellence, and service. These core values
              guide everything we do and shape the character of our students.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
