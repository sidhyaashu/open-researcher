import { Metadata } from 'next'
import OpenResearcherContent from './open-researcher/open-researcher-content'

export const metadata: Metadata = {
  title: 'Agentic Researcher',
  description: 'AI-powered search, scrape, and agentic reasoning',
    icons: {
    icon: '/kimmchi-logo.png',        // used for modern icons
  },
}

export default function Home() {
  return <OpenResearcherContent />
}
