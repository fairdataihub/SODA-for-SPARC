import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const IFrame = styled.iframe`
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
`;

export const ImgWrap = styled.div`
    margin-top: 25px;
    position: relative; 
    padding-bottom: 46.25%; 
    padding-top: 30px;
    padding-left: 40%;
    padding-right: 40%;
    height: 0; 
    overflow: hidden;
`;

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    list-style-type: decimal;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

const UserInterface = () => {
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
                <ArticleTitle>User Interface</ArticleTitle>
                <Section className='clickbelow'>
                <ArticleSubTitle>Click on the image below and watch our short video to get familiarized with SODA's user interface</ArticleSubTitle>
                <ImgWrap><IFrame src='https://youtube.com/embed/urZTp5L4F1g' 
                    allow='autoplay; encrypted-media'
                    allowfullscreentitle='video' 
                    title='video'/></ImgWrap>
                </Section>

                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <List>
                    <ListItem>The window size of the application frame can be easily adjusted to fit your screen by dragging the borders.</ListItem>
                    <ListItem>Closing the interface will stop any on-going process (dataset organization, uploading, etc).</ListItem>
                    <ListItem>Tooltips (i) are used throughout the interface to provide users with additional information.</ListItem>
                    <ListItem>Click on the document icon next to each feature's title to open the related documentation page in your browser.</ListItem>
                    <ListItem>A pop-up message will appear when launching the app if a newer version is available for download.</ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='clickbelow' smooth='true'>Click on the image below and watch our short video to get familiarized with SODA's user interface</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default UserInterface