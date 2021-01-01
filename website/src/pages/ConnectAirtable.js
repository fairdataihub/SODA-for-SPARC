import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/connect-to-airtable.gif'

export const Image = styled.img`
    width: 100%;
    
`;

export const ImgWrap =  styled.div`
    max-width: 700px;
    margin-top: 25px;
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

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ConnectAirtable = () => {
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
                <ArticleTitle>Connect to Airtable</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>SODA make use of the <Link>SPARC Airtable sheet</Link> to automatically get award numbers and contributors information such that you don't have to enter them manually in your metadata file. To enable this, you have to connect your Airtable account with SODA, which is achieved through this interface. You will only have to do that one time, SODA will then automatically connect to your Airtable account during subsequent uses.</ArticleP>
                <ArticleP>We suggest to keep your group information up to date in the Airtable sheet, especially contributors' name, email, affiliation, and ORCID to help SODA help you!</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Create an Airtable account and request access to the <Link>SPARC Airtable sheet</Link> (contact Dr. Charles Horn at <Link>chorn@pitt.edu</Link>).</ListItem>
                    <ListItem>Provide a key name of your choice and enter your Airtable API key in the dedicated SODA interface. Checkout the <Link>Airtable Help page</Link> to learn how to obtain or re-generate your API key. Note that the key will be stored locally on your computer and the SODA Team will not have access to it.</ListItem>
                    <ListItem>Click on "Connect".</ListItem>
                </List>
                <ImgWrap><Image src={image1} /></ImgWrap>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default ConnectAirtable
