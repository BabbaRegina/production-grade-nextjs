import React, { FC } from 'react'
import hydrate from 'next-mdx-remote/hydrate'
import { majorScale, Pane, Heading, Spinner } from 'evergreen-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import path from 'path'
import fs from 'fs'
import matter from 'gray-matter'
import renderToString from 'next-mdx-remote/render-to-string'
import { Post } from '../../types'
import Container from '../../components/container'
import HomeNav from '../../components/homeNav'
import { posts as postsFromCMS } from '../../content'

const BlogPost: FC<Post> = ({ source, frontMatter }) => {
  const content = hydrate(source)
  const router = useRouter()

  if (router.isFallback) {
    return (
      <Pane width="100%" height="100%">
        <Spinner size={48} />
      </Pane>
    )
  }
  return (
    <Pane>
      <Head>
        <title>{`Known Blog | ${frontMatter.title}`}</title>
        <meta name="description" content={frontMatter.summary} />
      </Head>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          <Heading fontSize="clamp(2rem, 8vw, 6rem)" lineHeight="clamp(2rem, 8vw, 6rem)" marginY={majorScale(3)}>
            {frontMatter.title}
          </Heading>
          <Pane>{content}</Pane>
        </Container>
      </main>
    </Pane>
  )
}

BlogPost.defaultProps = {
  source: '',
  frontMatter: { title: 'default title', summary: 'summary', publishedOn: '' },
}

/**
 * Need to get the paths here
 * then the the correct post for the matching path
 * Posts can come from the fs or our CMS
 */

export function getStaticPaths () {
  const postsPath = path.join(process.cwd(), 'posts')
  const fileNames = fs.readdirSync(postsPath)

  const slugs = fileNames.map(name => {
    const fullPath = path.join(process.cwd(), 'posts', name)
    const file = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(file)
    return data
  })

  return {
    paths: slugs.map(s => ({ params: { slug: s.slug } })),
    fallback: true
  }
 }

export async function getStaticProps ({ params = {}, preview = false } = {}) {
  let post
  try {
    const filePath = path.join(process.cwd(), 'posts', `${params.slug}.mdx`)
    post = fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    const postsCMS = (preview ? postsFromCMS.draft : postsFromCMS.published).map(post => matter(post))

    const match = postsCMS.find(p => p.data.slug === params.slug)
    post = match?.content || ''
  }

  const { data } = matter(post)
  const mdxSounce = await renderToString(post, { scope: data })
  return {
    props: {
      source: mdxSounce,
      frontMatter: data
    }
  }
}

export default BlogPost
