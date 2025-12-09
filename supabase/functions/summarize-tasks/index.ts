import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { tasks } = await req.json();
    console.log("Input tasks received:", JSON.stringify(tasks, null, 2));

    if (!Array.isArray(tasks) || tasks.length === 0) {
      console.log("No tasks to summarize");
      return new Response(
        JSON.stringify({ summary: "No tasks to summarize.", taskCount: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API key" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const taskList = tasks
      .map((task: any) => `- ${task.title}${task.description ? ": " + task.description : ""}`)
      .join("\n");
    console.log("Formatted task list:\n", taskList);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that prioritizes tasks.",
          },
          {
            role: "user",
            content: `Please help me prioritize these tasks, rank them from top to bottom priority:\n\n${taskList}`,
          },
        ],
        temperature: 1,
        max_completion_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI API error response:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response data:", JSON.stringify(openaiData, null, 2));
    const summary = openaiData.choices[0].message.content;
    console.log("Generated summary:", summary);

    const response = { summary, taskCount: tasks.length };
    console.log("Final response:", JSON.stringify(response, null, 2));
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in summarize-tasks function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});