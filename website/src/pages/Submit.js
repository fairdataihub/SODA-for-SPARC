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

export const H = styled.div`
    font-size: 24px;
    font-weight: 500;
    width: 100%;
    margin-top: 25px;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const Submit = () => {
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
                <ArticleTitle>Submit for Pre-publishing review</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>One year after the dataset completion date (as per the Data Deliverables document) or right after publishing results from the dataset, whichever comes first, you must publish your dataset to Blackfynn Discover, which populates the SPARC Data Portal, and make it public.</ArticleP>
                <ArticleP>As per the SPARC publishing process, When ready for publishing, you must submit your dataset for review to the Curation Team who will make a final check of your dataset and accept or reject the publication request. If accepted the dataset will be published automatically on Blackfynn Discover. Otherwise, the Curation Team will inform you of the reasons for rejecting.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Select a dataset from the drop-down list.</ListItem>
                    <ListItem>Click on "Submit for review". The dataset could also be withdrawn from review by clicking on "Withdraw from review".</ListItem>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>You must be dataset "owner" and have your ORCID linked on Blackfynn in order to submit for review. See feature "Manage dataset permissions" of SODA and our associated <Link>documentation</Link> for more information.</ArticleP>
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

export default Submit
