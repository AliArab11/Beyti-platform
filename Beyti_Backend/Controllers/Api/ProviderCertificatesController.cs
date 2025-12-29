using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProviderCertificatesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProviderCertificatesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ProviderCertificates
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProviderCertificate>>> GetProviderCertificates()
        {
            return await _context.ProviderCertificates.ToListAsync();
        }

        // GET: api/ProviderCertificates/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProviderCertificate>> GetProviderCertificate(int id)
        {
            var providerCertificate = await _context.ProviderCertificates.FindAsync(id);

            if (providerCertificate == null)
            {
                return NotFound();
            }

            return providerCertificate;
        }

        // PUT: api/ProviderCertificates/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProviderCertificate(int id, ProviderCertificate providerCertificate)
        {
            if (id != providerCertificate.Id)
            {
                return BadRequest();
            }

            _context.Entry(providerCertificate).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProviderCertificateExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/ProviderCertificates
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult> PostProviderCertificate(JsonElement body)
        {
            if (!body.TryGetProperty("providerApplicationId", out var appIdProp))
                return BadRequest("providerApplicationId is required");

            if (!body.TryGetProperty("title", out var titleProp))
                return BadRequest("title is required");

            if (!body.TryGetProperty("fileData", out var fileDataProp))
                return BadRequest("fileData is required");

            int providerApplicationId = appIdProp.GetInt32();
            string title = titleProp.GetString() ?? "";
            string fileData = fileDataProp.GetString() ?? "";

            // Validate application exists
            var appExists = await _context.ProviderApplications
                .AnyAsync(pa => pa.Id == providerApplicationId);
            if (!appExists)
                return BadRequest("Invalid providerApplicationId");

            // Parse base64 data (same pattern as ProductsController)
            var base64Data = fileData;
            if (base64Data.Contains(","))
            {
                base64Data = base64Data.Split(',')[1];
            }

            byte[] fileBytes;
            try
            {
                fileBytes = Convert.FromBase64String(base64Data);
            }
            catch (FormatException)
            {
                return BadRequest("Invalid base64 fileData");
            }

            // Determine file extension from data URL or default to pdf
            string extension = "pdf";
            if (fileData.Contains("data:"))
            {
                var mimeType = fileData.Split(';')[0].Split(':')[1];
                extension = mimeType switch
                {
                    "application/pdf" => "pdf",
                    "image/jpeg" => "jpg",
                    "image/png" => "png",
                    _ => "pdf"
                };
            }

            // Generate unique filename
            var fileName = $"cert_{providerApplicationId}_{Guid.NewGuid()}.{extension}";
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "certificates");

            // Create directory if doesn't exist
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

            // Store relative path
            var fileUrl = $"/certificates/{fileName}";

            // Optional: Parse expiresAt
            DateOnly? expiresAt = null;
            if (body.TryGetProperty("expiresAt", out var expiresAtProp)
                && expiresAtProp.ValueKind != JsonValueKind.Null)
            {
                var expiresAtStr = expiresAtProp.GetString();
                if (!string.IsNullOrEmpty(expiresAtStr) && DateOnly.TryParse(expiresAtStr, out var parsed))
                {
                    expiresAt = parsed;
                }
            }

            var certificate = new ProviderCertificate
            {
                ProviderApplicationId = providerApplicationId,
                Title = title,
                FileUrl = fileUrl,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.Now
            };

            _context.ProviderCertificates.Add(certificate);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProviderCertificate", new { id = certificate.Id }, new
            {
                id = certificate.Id,
                providerApplicationId = certificate.ProviderApplicationId,
                title = certificate.Title,
                fileUrl = certificate.FileUrl,
                expiresAt = certificate.ExpiresAt,
                createdAt = certificate.CreatedAt
            });
        }

        // DELETE: api/ProviderCertificates/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProviderCertificate(int id)
        {
            var providerCertificate = await _context.ProviderCertificates.FindAsync(id);
            if (providerCertificate == null)
            {
                return NotFound();
            }

            _context.ProviderCertificates.Remove(providerCertificate);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProviderCertificateExists(int id)
        {
            return _context.ProviderCertificates.Any(e => e.Id == id);
        }
    }
}
