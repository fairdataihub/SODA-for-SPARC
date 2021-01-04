import React, { useState } from 'react'
import Sidebar from '../components/home/Sidebar'
import Navbar from '../components/home/NavBar'
import HeroSection from '../components/home/HeroSection'
import AboutSection from '../components/home/AboutSection'
import DownloadSection from '../components/home/DownloadSection'
import FeatureSection from '../components/home/FeatureSection'
import TeamSection from '../components/home/TeamSection'
import { teamObj, featureObj, aboutObj, downloadObj } from '../components/home/data'
import Footer from '../components/home/Footer'

const Home = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };

    return (
        <div>
            <Sidebar isOpen={isOpen} toggle={toggle} />
            <Navbar toggle={toggle} />
            <HeroSection />
            <AboutSection {...aboutObj} />
            <FeatureSection {...featureObj} />
            <DownloadSection {...downloadObj}/>
            <TeamSection {...teamObj} />
            <Footer />
        </div>
    )
}

export default Home
