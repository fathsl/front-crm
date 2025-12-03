import {
  Eye,
  Facebook,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SocialMediaDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const FB_ACCESS_TOKEN =
    "EAALPqqyYnVUBPpuopWdyr5YdZCY8rIkHvkwhAdU94DKHbkJlaxMrI1TADOLCIxzJy437ZAe66lzvHBb7mo72c6mYxmJCwNRlHZBSld8xAvoajziIyKsSdWi7I0Y1OPGA6g550XufSYCDbc47lo1v4CBo6rxMcE0R0SRT8Fi4vtq5Lxb56Ol96vXZAJSO64u8";
  const PAGE_ID = "";

  const [socialData, setSocialData] = useState({
    facebook: {
      followers: 12453,
      likes: 8932,
      shares: 542,
      engagement: 7.8,
      recentPosts: 24,
      url: "https://facebook.com/yourpage",
    },
    instagram: {
      followers: 25678,
      likes: 15420,
      comments: 892,
      engagement: 9.2,
      recentPosts: 36,
      url: "https://instagram.com/yourpage",
    },
    linkedin: {
      followers: 8934,
      impressions: 45230,
      engagement: 5.4,
      posts: 18,
      connections: 1250,
      url: "https://linkedin.com/company/yourpage",
    },
  });

  useEffect(() => {
    initializeFacebook();
  }, []);

  const initializeFacebook = async () => {
    if (
      !FB_ACCESS_TOKEN ||
      FB_ACCESS_TOKEN ===
        "EAALPqqyYnVUBPpuopWdyr5YdZCY8rIkHvkwhAdU94DKHbkJlaxMrI1TADOLCIxzJy437ZAe66lzvHBb7mo72c6mYxmJCwNRlHZBSld8xAvoajziIyKsSdWi7I0Y1OPGA6g550XufSYCDbc47lo1v4CBo6rxMcE0R0SRT8Fi4vtq5Lxb56Ol96vXZAJSO64u8"
    ) {
      setError("Please add your Facebook access token in the code");
      setLoading(false);
      return;
    }

    if (!PAGE_ID) {
      await fetchAvailablePages();
    } else {
      await fetchFacebookData(PAGE_ID);
    }
  };

  const fetchAvailablePages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${FB_ACCESS_TOKEN}`
      );
      const data = await response.json();

      if (data.error) {
        setError(`Facebook API Error: ${data.error.message}`);
        setLoading(false);
        return;
      }

      if (data.data && data.data.length > 0) {
        await fetchFacebookData(data.data[0].id, data.data[0].access_token);
      } else {
        setError(
          "No Facebook Pages found. You need a Facebook Page, not a personal profile."
        );
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to fetch Facebook pages");
      setLoading(false);
    }
  };

  const fetchFacebookData = async (pageId: string, pageToken?: string) => {
    try {
      setLoading(true);
      setError("");

      const token = pageToken || FB_ACCESS_TOKEN;

      const pageResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=name,fan_count,link&access_token=${token}`
      );
      const pageData = await pageResponse.json();

      if (pageData.error) {
        throw new Error(pageData.error.message);
      }

      const postsResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),shares,comments.summary(true)&limit=25&access_token=${token}`
      );
      const postsData = await postsResponse.json();

      if (postsData.error) {
        throw new Error(postsData.error.message);
      }

      let totalLikes = 0;
      let totalShares = 0;
      let totalComments = 0;

      if (postsData.data) {
        postsData.data.forEach((post: any) => {
          totalLikes += post.likes?.summary?.total_count || 0;
          totalShares += post.shares?.count || 0;
          totalComments += post.comments?.summary?.total_count || 0;
        });
      }

      const followers = pageData.fan_count || 0;
      const totalEngagement = totalLikes + totalShares + totalComments;
      const postsCount = postsData.data?.length || 1;
      const engagementRate =
        followers > 0
          ? ((totalEngagement / postsCount / followers) * 100).toFixed(1)
          : "0";

      setSocialData((prev) => ({
        ...prev,
        facebook: {
          followers: followers,
          likes: totalLikes,
          shares: totalShares,
          engagement: parseFloat(engagementRate),
          recentPosts: postsCount,
          url: pageData.link || `https://facebook.com/${pageId}`,
        },
      }));

      console.log("socialData", socialData);
      console.log("followers", followers);
      console.log("totalLikes", totalLikes);
      console.log("totalShares", totalShares);
      console.log("totalComments", totalComments);
      console.log("engagementRate", engagementRate);

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching Facebook data:", err);
      setError(`Failed to load Facebook data: ${err.message}`);
      setLoading(false);
    }
  };

  const navigateToPage = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Social Media Dashboard
          </h1>
          <p className="text-purple-200">
            Monitor your social presence across all platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                Total Followers
              </h3>
              <UsersIcon className="text-purple-300" size={24} />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {(
                socialData.facebook.followers +
                socialData.instagram.followers +
                socialData.linkedin.followers
              ).toLocaleString()}
            </p>
            <p className="text-purple-200 text-sm">Across all platforms</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                Total Engagement
              </h3>
              <Heart className="text-pink-300" size={24} />
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {(
                socialData.facebook.likes + socialData.instagram.likes
              ).toLocaleString()}
            </p>
            <p className="text-purple-200 text-sm">Likes & reactions</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                Avg. Engagement
              </h3>
              <TrendingUp className="text-green-300" size={24} />
            </div>
            <p className="text-4xl font-bold text-white mb-2">7.5%</p>
            <p className="text-purple-200 text-sm">Combined rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-2xl transform transition hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-full p-2">
                  <Facebook className="text-blue-600" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">Facebook</h2>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Followers</span>
                <span className="text-white font-bold text-lg">
                  {socialData.facebook.followers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Likes</span>
                <span className="text-white font-bold text-lg">
                  {socialData.facebook.likes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Shares</span>
                <span className="text-white font-bold text-lg">
                  {socialData.facebook.shares}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Engagement Rate</span>
                <span className="text-white font-bold text-lg">
                  {socialData.facebook.engagement}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Recent Posts</span>
                <span className="text-white font-bold text-lg">
                  {socialData.facebook.recentPosts}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateToPage(socialData.facebook.url)}
              className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              View Page
              <Share2 size={18} />
            </button>
          </div>

          {/*  <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-orange-500 rounded-2xl p-6 shadow-2xl transform transition hover:scale-105">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2">
                    <Instagram className="text-pink-600" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Instagram</h2>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-pink-100">Followers</span>
                  <span className="text-white font-bold text-lg">{socialData.instagram.followers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pink-100">Likes</span>
                  <span className="text-white font-bold text-lg">{socialData.instagram.likes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pink-100">Comments</span>
                  <span className="text-white font-bold text-lg">{socialData.instagram.comments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pink-100">Engagement Rate</span>
                  <span className="text-white font-bold text-lg">{socialData.instagram.engagement}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pink-100">Recent Posts</span>
                  <span className="text-white font-bold text-lg">{socialData.instagram.recentPosts}</span>
                </div>
              </div>

              <button
                onClick={() => navigateToPage(socialData.instagram.url)}
                className="w-full bg-white text-purple-600 font-semibold py-3 rounded-lg hover:bg-pink-50 transition flex items-center justify-center gap-2"
              >
                View Profile
                <Share2 size={18} />
              </button>
            </div>
  
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 shadow-2xl transform transition hover:scale-105">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2">
                    <Linkedin className="text-blue-700" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">LinkedIn</h2>
                </div>
              </div>
  
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Followers</span>
                  <span className="text-white font-bold text-lg">{socialData.linkedin.followers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Impressions</span>
                  <span className="text-white font-bold text-lg">{socialData.linkedin.impressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Connections</span>
                  <span className="text-white font-bold text-lg">{socialData.linkedin.connections.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Engagement Rate</span>
                  <span className="text-white font-bold text-lg">{socialData.linkedin.engagement}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Posts</span>
                  <span className="text-white font-bold text-lg">{socialData.linkedin.posts}</span>
                </div>
              </div>
  
              <button
                onClick={() => navigateToPage(socialData.linkedin.url)}
                className="w-full bg-white text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                View Company
                <Share2 size={18} />
              </button>
            </div> */}
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <MessageCircle
                className="mx-auto text-purple-300 mb-2"
                size={24}
              />
              <p className="text-2xl font-bold text-white">
                {socialData.instagram.comments + 234}
              </p>
              <p className="text-purple-200 text-sm">Total Comments</p>
            </div>
            <div>
              <Share2 className="mx-auto text-purple-300 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">
                {socialData.facebook.shares}
              </p>
              <p className="text-purple-200 text-sm">Total Shares</p>
            </div>
            <div>
              <Eye className="mx-auto text-purple-300 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">
                {socialData.linkedin.impressions.toLocaleString()}
              </p>
              <p className="text-purple-200 text-sm">Total Views</p>
            </div>
            <div>
              <TrendingUp className="mx-auto text-green-300 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">+12.5%</p>
              <p className="text-purple-200 text-sm">Growth Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
