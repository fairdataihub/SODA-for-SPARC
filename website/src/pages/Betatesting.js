import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, ArticleP, Section,Scroll, ScrollTitle, ScrollSubTitle, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const BetaTesting = () => {
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
                <ArticleTitle>Results from preliminary evaluation of SODA by our beta testers</ArticleTitle>
                <Section className='review'>
                <ArticleSubTitle>Review Procedure</ArticleSubTitle>
                <ArticleP>Our beta testers have reviewed our software every time a new feature was implemented to test it and provide feedback for improving. Once most major features were included we ask them to evaluate the performance and usability of SODA for the entire curation and sharing processes of SPARC. We provided a sample non-curated dataset with enough instruction about its provenance so that anyone could curate it according to the SPARC standards. We asked them to curate and share the sample dataset without SODA for SPARC (Task A) and with SODA for SPARC (Task B). Half of them were asked to complete Task A first then Task B while the other half were asked to do the other way around.</ArticleP>
                </Section>

                <Section className='results'>
                <ArticleSubTitle>Results</ArticleSubTitle>
                <ArticleP>Based on their responses, all of them had already gone through the entire curation and sharing processes without SODA (between one to ten times according) while it was their first time doing so with SODA. Yet, we found that SODA for SPARC divided on average by three the time required to curate and share a dataset and made it relatively easier to understand and implement the requirements. After evaluating the shared datasets, we also found that SODA for SPARC reduces human errors significantly in the curation and sharing processes (no errors at all when the user followed instructions of the user-manual properly).</ArticleP>
                </Section>

                <Section className='betatesters'>
                <ArticleSubTitle>Beta Testers</ArticleSubTitle>
                <ArticleP>The list of our ten beta testers, all SPARC-funded researchers from different research groups, is available <Link href='https://github.com/bvhpatel/SODA#acknowledgements' target='_blank'>here</Link>.</ArticleP>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='review' smooth='true'>Review procedure</ScrollSubTitle>
                <ScrollSubTitle to='results' smooth='true'>Results</ScrollSubTitle>
                <ScrollSubTitle to='betatesters' smooth='true'>Beta testers</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default BetaTesting