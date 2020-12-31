import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

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

const SparcConsortium = () => {
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
                <ArticleTitle>Share with SPARC Consortium</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>Once your dataset is approved by the Curation Team, it is ready to be shared with the SPARC Consortium as embargoed dataset. Sharing will give "viewer" permissions to any SPARC investigator who has signed the SPARC Non-disclosure form and will allow them to see your data.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Select a dataset from the drop-down list.</ListItem>
                    <ListItem>Click on ’Share with SPARC Consortium’’ to add your dataset to their review queue.</ListItem>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>You must have "owner" or "manager" permissions on the dataset to share with the SPARC consortium. See feature "Manage dataset permissions" of SODA and our associated <Link>documentation</Link> for more information.</ArticleP>
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

export default SparcConsortium
