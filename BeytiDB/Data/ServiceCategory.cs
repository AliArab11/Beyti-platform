using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ServiceCategory")]
public class ServiceCategory
{
        public ServiceCategory()
        {
            // Initialize the list to prevent NullReferenceException
            ServiceCatalogs = new HashSet<ServiceCatalog>();
            ServiceProviders = new HashSet<ServiceProvider>();
            CreatedAt = DateTime.Now;
            IsActive = true;
        }

        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(255)]
        public string Description { get; set; } = null!;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation Property: One Category has many Catalogs
        public virtual ICollection<ServiceCatalog> ServiceCatalogs { get; set; }

        // Navigation Property: One Category has many Service Providers enrolled to it
        public virtual ICollection<ServiceProvider> ServiceProviders { get; set; }
    }
