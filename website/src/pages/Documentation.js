import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, ArticleP, Section,Scroll, ScrollTitle, ScrollSubTitle, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import img from '../images/logo-soda1024.png'
import styled from 'styled-components'

export const Image = styled.img`
    width: 100%;
    
`;

export const ImgWrap =  styled.div`
    max-width: 700px;
    margin-top: 25px;
`;

const Documentation = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };
    return (
        <div>
            <SidebarRes isOpen={isOpen} toggle={toggle} />
            <Sidebar toggle={toggle}/>
            <Page
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}>  
                <Article>
                    <ArticleTitle>SODA Documentation</ArticleTitle>
                    <Section>
                    <ArticleSubTitle>Welcome to the SODA User Manual</ArticleSubTitle>
                    <ImgWrap><Image src={img} /></ImgWrap>
                    <ArticleP>We document here everything there is to know about SODA. Please navigate through the sidebar to find out more about SODA and the different features that are available to organize and submit your SPARC datasets.</ArticleP>
                    </Section>
                </Article>
                <ScrollContainer>
                {/* <Scroll>
                    <ScrollTitle>In this article</ScrollTitle>
                    <ScrollSubTitle>Welcome to the SODA User Manual</ScrollSubTitle>
                </Scroll> */}
                </ScrollContainer>
            </Page>
        </div>
    )
}

export default Documentation