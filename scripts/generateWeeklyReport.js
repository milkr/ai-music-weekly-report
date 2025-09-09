const axios = require('axios');
const moment = require('moment');

// Configuration
const CONFIG = {
    composioApiKey: process.env.COMPOSIO_API_KEY,
    notionDatabaseId: process.env.NOTION_DATABASE_ID,
    baseUrl: 'https://composio-api.com/v1',
    timezone: 'Asia/Shanghai'
};

// Date utilities
function getWeekDateRange() {
    // Get last 7 days from yesterday (to avoid timezone issues)
    const endDate = moment().subtract(1, 'day');
    const startDate = moment(endDate).subtract(6, 'days');
    
    return {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        weekNumber: moment().week(),
        year: moment().year(),
        dateRange: `${startDate.format('M月1日')}-${endDate.format('M月1日')}`
    };
}

// Twitter/X.com data fetching
async function fetchTwitterData() {
    try {
        console.log('Fetching Twitter/X.com data...');
        
        const response = await axios.post(`${CONFIG.baseUrl}/tools/execute`, {
            tool_slug: 'TWITTER_SEARCH_TWEETS',
            arguments: {
                query: 'AI music OR "AI generated music" OR "generative music" OR suno OR mureka',
                max_results: 100,
                tweet_fields: 'public_metrics,created_at,author_id',
                sort_order: 'relevancy'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.composioApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const tweets = response.data?.data || [];
        
        // Calculate engagement scores and sort
        const processedTweets = tweets.map(tweet => ({
            ...tweet,
            engagement_score: (tweet.public_metrics?.like_count || 0) + 
                               (tweet.public_metrics?.retweet_count || 0) + 
                               (tweet.public_metrics?.reply_count || 0) + 
                               (tweet.public_metrics?.quote_count || 0)
        })).sort((a, b) => b.engagement_score - a.engagement_score);

        return processedTweets.slice(0, 5); // Top 5
    } catch (error) {
        console.error('Error fetching Twitter data:', error.message);
        return [];
    }
}

// Reddit data fetching
async function fetchRedditData() {
    try {
        console.log('Fetching Reddit data...');
        
        const response = await axios.post(`${CONFIG.baseUrl}/tools/execute`, {
            tool_slug: 'REDDIT_SEARCH_POSTS',
            arguments: {
                query: 'AI music OR "AI generated music" OR "generative music" OR suno OR mureka',
                sort: 'top',
                time_filter: 'week',
                limit: 50
            }
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.composioApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const posts = response.data?.data || [];
        
        // Calculate engagement scores and sort
        const processedPosts = posts.map(post => ({
            ...post,
            engagement_score: (post.score || 0) + (post.num_comments || 0)
        })).sort((a, b) => b.engagement_score - a.engagement_score);

        return processedPosts.slice(0, 5); // Top 5
    } catch (error) {
        console.error('Error fetching Reddit data:', error.message);
        return [];
    }
}

// Generate report content
function generateReportContent(twitterData, redditData, dateInfo) {
    const maxTwitterEngagement = twitterData.length > 0 ? Math.max(...twitterData.map(t => t.engagement_score)) : 0;
    const maxRedditEngagement = redditData.length > 0 ? Math.max(...redditData.map(r => r.engagement_score)) : 0;

    let content = `# AI音乐热阠05᛭认周报 - ${dateInfo.year}年孖${dateInfo.weekNumber}疯 (${dateInfo.dateRange})\\n\\n`;
    
    content += `## 📊 本周数据概覥\\n\\n`;
    content += `- **Twitter/X.com最高互动**: ${maxTwitterEngagement.toLocaleString()}\\n`;
    content += `- **Reddit最高互动**: ${maxRedditEngagement.toLocaleString()}\\n`;
    content += `- **数据收吅消鑴**: ${moment().tz(COMNFIG.timezone).format('YYYY-MM-DD HH:mm:ss')} (北京时间)\\n\\n`;

    // Twitter section
    content += `## 🐆 Twitter/X.com Top 5\\n\\n`;
    if (twitterData.length > 0) {
        twitterData.forEach((tweet, index) => {
            content += `### ${index + 1}. ${tweet.text?.substring(0, 100) || 'Tweet content'}...\\n`;
            content += `- **互动数**: ${tweet.engagement_score.toLocaleString()}\\n`;
            content += `- **发布时间**: ${moment(tweet.created_at).format('YYYY-MM-DD HH:mm')}\\n`;
            content += `- **链接**: https://twitter.com/i/status/${tweet.id}\\n\\n`;
        });
    } else {
        content += `暂无数据\\n\\n`;
    }

    // Reddit section
    content += `## 🐗 Reddit Top 5\\n\\n`;
    if (redditData.length > 0) {
        redditData.forEach((post, index) => {
            content += `### ${index + 1}. ${post.title || 'Reddit post'}\\n`;
            content += `- **氳桬捰**: ${post.engagement_score.toLocaleString()}\\n`;
            content += `- **发布时间**: ${moment.unix(post.created_utc).format('YYYY-MM-DD HH:mm')}\\n`;
            content += `- **链接**: https://reddit.com${post.permalink}\\n\\n`;
        });
    } else {
        content += `暂无数据\\n\\n`;
    }

    content += `## 📈 赋势分析\\n\\n`;
    if (maxTwitterEngagement > maxRedditEngagement) {
        const ratio = (maxTwitterEngagement / Math.max(maxRedditEngagement, 1)).toFixed(1);
        content += `本呦Twitter/X.com。互动瘄扎明昽高于Reddit，最高互动比侻为${ratio}:1。`;
    } else if (maxRedditEngagement > maxTwitterEngagement) {
        const ratio = (maxRedditEngagement / Math.max(maxTwitterEngagement, 1)).toFixed(1);
        content += `朊呩Reddit。互动瘄扎明昽高于Twitter/X.com��最高互动比侻为${ratio}:1。`;
    } else {
        content += `本呩谥个平台的亢动焦寧泸前。`;
    }

    content += `\\n\\n---\\n*(由AI音告周报自厨厖系统석成ꌣ*`;

    return {
        content,
        maxTwitterEngagement,
        maxRedditEngagement
    };
}

// Save to Notion
async function saveToNotion(reportData, dateInfo) {
    try {
        console.log('Saving report to Notion...');
        
        const response = await axios.post(`${CONFIG.baseUrl}/tools/execute`, {
            tool_slug: 'NOTION_CREATE_PAGE',
            arguments: {
                parent: { database_id: CONFIG.notionDatabaseId },
                properties: {
                    "报呭筈�b": {
                        title: [{
                            text: {
                                content: `AI音乐热陠H5孹境o�唣��秘�周报 - ${dateInfo.year}h年第${dateInfo.weekNumber}呪 (${dateInfo.dateRange})`
                            }
                        }]
                    },
                    "报呭日挢~z : S {
                        date: {
                            start: moment().format('YYYY-MM-DD')
                        }
                    },
                    "周is:�  0;
                        rich_text: [{
                            text: {
                                content: `${dateInfo.year}年?ᥴ${dateInfo.weekNumber}疯`
                            }
                        }]
                    },
                    "Twitter最高互动
': {
                        number: reportData.maxTwitterEngagement
                    },
                    "Reddit✀高互动
': {
                        number: reportData.maxRedditEngagement
                    },
                    "爧慁": {
                        select: {
                            name: "已完成"
                        }
                    }
                },
                children: [{
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{
                            type: "text",
                            text: {
                                content: reportData.content
                            }
                        }]
                    }
                }]
            }
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.composioApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Report saved successfully to Notion!');
        return response.data;
    } catch (error) {
        console.error('Error saving to Notion:', error.message);
        throw error;
    }
}

// Main execution function
async function main() {
    try {
        console.log('🚀 Starting AI Music Weekly Report Generation...');
        console.log(`⍰ Beijing Time: ${moment().tz(COMNFIG.timezone).format('YYYY-MM-DD HH:mm:ss')}`);
        
        // Validate environment variables
        if (!CONFIG.composioApiKey || !CONFIG.notionDatabaseId) {
            throw new Error('Missing required environment variables: COMPOSIO_API_KEY and NOTION_DATABASE_ID');
        }

        // Get date information
        const dateInfo = getWeekDateRange();
        console.log(`📅 㹔4��e�erating report for: ${dateInfo.dateRange} (${dateInfo.year}年?��i���ז�}\���Z�^�+	;q);�
       
        // Fetch data from both platforms
        const [twitterData, redditData] = await Promise.all([
            fetchTwitterData(),
            fetchRedditData()
        ]);

        console.log(`📊  {$ata collected - Twitter: ${twitterData.length} posts, Reddit: ${redditData.length} posts`);

        // Generate report
        const reportData = generateReportContent(twitterData, redditData, dateInfo);
        
        // Save to Notion
        await saveToNotion(reportData, dateInfo);

        console.log('❅ Weekly AI Music Report generated and saved successfully!');
        
        // Output summary for GitHub Actions
        console.log('\\n=== REPORT SUMMARY ===');
        console.log(`Week: ${dateInfo.year}年皲�잚4{dateInfo.weekNumber}呪 (${dateInfo.dateRange})`);
        console.log(`Twitter Max Engagement: ${reportData.maxTwitterEngagement.toLocaleString()}`);
        console.log(`Reddit Max Engagement: ${reportData.maxRedditEngagement.toLocaleString()}`);
        console.log(`Generated at: ${moment().tz(COMNFIG.timezone).format('YYYY-MM-DD HH:mm:ss')} Beijing Time`);

    } catch (error) {
        console.error('ℎ Error generating report:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = { main, generateReportContent, getWeekDateRange };
