import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/connect-to-blackfynn.gif'
import image2 from '../images/select-existing-BF-account.gif'

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

const BlackfynnAcc = () => {
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
                <ArticleTitle>Connect to your Blackfynn Account</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>SPARC uses the Blackfynn platform to store data and metadata files as well as append additional metadata. All SPARC researchers must thus share their data on Blackfynn. When using SODA for the first time, you will have to connect your Blackfynn account with SODA to use Blackfynn related functionalities implemented in SODA.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Enter your key name, API key, and API secret in the corresponding fields under "Add new account" then click on "Add account". Follow the instructions on the Blackfynn help page to get a key name, API key, and API secret. If added successfully, the account key name will appear in the drop down list under "Select existing account".</ListItem>
                    <ImgWrap><Image src={image1} style={{ marginBottom: 30 + 'px'}} /></ImgWrap>
                    <ListItem>SODA will pull a list of your datasets from your Blackfynn account. You can filter visible datasets in the SODA interface based on your permission on the dataset. The default filter is "All" that shows you all the datasets for which you have permissions. It may take some time (1-2 minutes) to load the datasets initially since we have to check permissions one by one (there is no faster way currently). You can then change the filter to more specific permissions (owner, manager, editor, viewer).
                    </ListItem>
                    <ImgWrap><Image src={image2} /></ImgWrap>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <List>
                    <ListItem>During subsequent use, SODA will automatically connect to the account you were connected to last time. If you have multiple Blackfynn accounts registered in SODA (e.g., one for the SPARC consortium organization and one for your lab's organization) you can switch between them under "Select existing account". Click on "Switch Account" to see all available accounts then select the desired one in the dropdown list.</ListItem>
                    <ListItem>Selecting an account under "Select existing account" is necessary to use any feature of SODA related to Blackfynn.</ListItem>
                    <ListItem>The account key and secret for your Blackfynn account(s) will be stored on your computer only, so neither the SODA Team nor anyone else besides you will have access to your Blackfynn account(s).</ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default BlackfynnAcc
