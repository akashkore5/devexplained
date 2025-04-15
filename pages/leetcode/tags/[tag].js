import problems from '../../../data/problems.json';

export async function getServerSideProps({ params }) {
  const { tag } = params;
  const validTags = new Map();
  problems.forEach((problem) => {
    if (problem.tags && Array.isArray(problem.tags)) {
      problem.tags.forEach((t) => {
        validTags.set(t, t); // Map lowercase to original tag
      });
    }
  });

  const lowercaseTag = tag;
  if (!validTags.has(lowercaseTag)) {
    return {
      notFound: true,
    };
  }

  // Use the original tag from problems.json (lowercase)
  const redirectTag = validTags.get(lowercaseTag);

  return {
    redirect: {
      destination: `/leetcode?tag=${encodeURIComponent(redirectTag)}`,
      permanent: false,
    },
  };
}

export default function TagPage() {
  // This component is never rendered due to the redirect
  return null;
}