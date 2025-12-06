var builder = WebApplication.CreateBuilder(args);

// allow CORS for dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // optional if using credentials
    });
});

var app = builder.Build();

app.UseCors("AllowLocalDev");

app.MapControllers();
app.Run();
